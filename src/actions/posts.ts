'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/session';
import { postSchema } from '@/lib/validation';
import type { ServerActionResponse, PostSection, PostView, ReactionEmoji, FeedSection } from '@/types';

export async function createPost(
  section: PostSection,
  body: string
): Promise<ServerActionResponse<{ id: string }>> {
  try {
    const profile = await requireProfile();
    const validated = postSchema.safeParse({ section, body: body.trim() });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || 'Invalid post' };
    }

    const supabase = await createClient();

    // Check rate limit: max 5 posts per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', profile.id)
      .gt('created_at', oneHourAgo);

    if (!countError && count !== null && count >= 5) {
      return { success: false, error: 'Rate limit reached: max 5 posts per hour' };
    }

    const { data: post, error: insertError } = await supabase
      .from('posts')
      .insert({
        author_id: profile.id,
        section: validated.data.section,
        body: validated.data.body,
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    return { success: true, data: { id: post.id } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create post';
    return { success: false, error: message };
  }
}

export async function getFeedPosts(
  section: FeedSection = 'all',
  sortBy: 'new' | 'hot' = 'new',
  cursor?: string,
  limit: number = 20
): Promise<ServerActionResponse<{ posts: PostView[]; nextCursor: string | null }>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Try SQL RPC with database-computed Hot/New ranking
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_feed_posts', {
      p_section: section,
      p_sort: sortBy,
      p_cursor: cursor || null,
      p_limit: limit,
    });

    if (!rpcError && Array.isArray(rpcData)) {
      // Enrich with user's own reaction if signed in
      const postsWithUserReaction: PostView[] = await Promise.all(
        rpcData.map(async (row: any) => {
          let userReaction: ReactionEmoji | null = null;
          if (user) {
            const { data: myReaction } = await supabase
              .from('reactions')
              .select('emoji')
              .eq('post_id', row.id)
              .eq('user_id', user.id)
              .maybeSingle();
            userReaction = myReaction?.emoji || null;
          }

          return {
            id: row.id,
            section: row.section as PostSection,
            body: row.body,
            created_at: row.created_at,
            handle: row.handle,
            reaction_counts: {
              '🔥': Number(row.fire_count || 0),
              '😂': Number(row.laugh_count || 0),
              '💀': Number(row.skull_count || 0),
            },
            comment_count: Number(row.comment_count || 0),
            user_reaction: userReaction,
          };
        })
      );

      const nextCursor =
        rpcData.length === limit ? rpcData[rpcData.length - 1].created_at : null;

      return { success: true, data: { posts: postsWithUserReaction, nextCursor } };
    }

    // 2. Resilient fallback to direct table query if RPC is not yet in Supabase
    let query = supabase
      .from('posts')
      .select('id, section, body, author_id, created_at, is_hidden')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (section !== 'all') {
      query = query.eq('section', section);
    }

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: posts, error } = await query;
    if (error) throw error;

    // Fetch author handles safely
    const authorIds = Array.from(new Set((posts || []).map((p: any) => p.author_id).filter(Boolean)));
    const handleMap = new Map<string, string>();
    if (authorIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, handle')
        .in('id', authorIds);
      (profs || []).forEach(p => handleMap.set(p.id, p.handle));
    }

    const enrichedPosts: PostView[] = await Promise.all(
      (posts || []).map(async (p: any) => {
        const [reactionsRes, commentsCountRes, myReactionRes] = await Promise.all([
          supabase.from('reactions').select('emoji').eq('post_id', p.id),
          supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', p.id).eq('is_hidden', false),
          user
            ? supabase.from('reactions').select('emoji').eq('post_id', p.id).eq('user_id', user.id).maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        const reactionCounts: Record<ReactionEmoji, number> = {
          '🔥': 0,
          '😂': 0,
          '💀': 0,
        };

        (reactionsRes.data || []).forEach((r: { emoji: ReactionEmoji }) => {
          if (reactionCounts[r.emoji] !== undefined) {
            reactionCounts[r.emoji] += 1;
          }
        });

        return {
          id: p.id,
          section: p.section as PostSection,
          body: p.body,
          created_at: p.created_at,
          handle: handleMap.get(p.author_id) || 'Anonymous',
          reaction_counts: reactionCounts,
          comment_count: commentsCountRes.count || 0,
          user_reaction: myReactionRes.data?.emoji || null,
        };
      })
    );

    if (sortBy === 'hot') {
      enrichedPosts.sort((a, b) => {
        const scoreA = (a.reaction_counts['🔥'] * 2 + a.reaction_counts['😂'] + a.reaction_counts['💀']) + a.comment_count * 2;
        const scoreB = (b.reaction_counts['🔥'] * 2 + b.reaction_counts['😂'] + b.reaction_counts['💀']) + b.comment_count * 2;
        return scoreB - scoreA;
      });
    }

    const nextCursor =
      posts && posts.length === limit ? posts[posts.length - 1].created_at : null;

    return { success: true, data: { posts: enrichedPosts, nextCursor } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch posts';
    return { success: false, error: message };
  }
}

export async function getPostDetail(id: string): Promise<ServerActionResponse<PostView>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Query post directly
    const { data: p, error } = await supabase
      .from('posts')
      .select('id, section, body, author_id, created_at, is_hidden')
      .eq('id', id)
      .eq('is_hidden', false)
      .single();

    if (error || !p) throw new Error('Post not found or has been removed');

    // Fetch author's handle safely
    let authorHandle = 'Anonymous';
    if (p.author_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('handle')
        .eq('id', p.author_id)
        .maybeSingle();
      if (profile?.handle) authorHandle = profile.handle;
    }

    const [reactionsRes, commentsCountRes, myReactionRes] = await Promise.all([
      supabase.from('reactions').select('emoji').eq('post_id', p.id),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', p.id).eq('is_hidden', false),
      user
        ? supabase.from('reactions').select('emoji').eq('post_id', p.id).eq('user_id', user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const reactionCounts: Record<ReactionEmoji, number> = {
      '🔥': 0,
      '😂': 0,
      '💀': 0,
    };

    (reactionsRes.data || []).forEach((r: { emoji: ReactionEmoji }) => {
      if (reactionCounts[r.emoji] !== undefined) {
        reactionCounts[r.emoji] += 1;
      }
    });

    return {
      success: true,
      data: {
        id: p.id,
        section: p.section as PostSection,
        body: p.body,
        created_at: p.created_at,
        handle: authorHandle,
        reaction_counts: reactionCounts,
        comment_count: commentsCountRes.count || 0,
        user_reaction: myReactionRes.data?.emoji || null,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load post';
    return { success: false, error: message };
  }
}
