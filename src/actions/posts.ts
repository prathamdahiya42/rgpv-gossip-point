'use server';

import { createClient } from '@/lib/supabase/server';
import { requireVerified } from '@/lib/auth/session';
import type { ServerActionResponse, Post, PostWithCommunity } from '@/types';

export async function createPost(
  communityId: string,
  content: string
): Promise<ServerActionResponse<Post>> {
  try {
    const user = await requireVerified();
    const supabase = await createClient();

    // Check community exists and is approved
    const { data: community, error: commError } = await supabase
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .eq('status', 'approved')
      .single();

    if (commError || !community) {
      throw new Error('Community not found or not approved');
    }

    // Check whitelist if community is in approved_posters mode
    if (community.mode === 'approved_posters') {
      const { data: poster } = await supabase
        .from('community_posters')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', user.id)
        .single();

      if (!poster) {
        throw new Error('You are not an approved poster in this community');
      }
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        community_id: communityId,
        user_id: user.id,
        pseudonym_shown: user.pseudonym,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: post };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create post';
    return { success: false, error: message };
  }
}

export async function getFeedPosts(
  communityId?: string,
  cursor?: string,
  limit: number = 20
): Promise<ServerActionResponse<{ posts: PostWithCommunity[]; nextCursor: string | null }>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('posts')
      .select(`
        *,
        community:communities!inner(id, name)
      `)
      .eq('status', 'visible')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (communityId) {
      query = query.eq('community_id', communityId);
    }

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: posts, error } = await query;
    if (error) throw error;

    // Fetch reaction counts and comment counts for each post
    const enrichedPosts: PostWithCommunity[] = await Promise.all(
      (posts || []).map(async (post) => {
        // Get reaction counts
        const { data: reactions } = await supabase
          .from('reactions')
          .select('type')
          .eq('target_type', 'post')
          .eq('target_id', post.id);

        const reactionCounts: Record<string, number> = {};
        (reactions || []).forEach(r => {
          reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
        });

        // Get comment count
        const { count } = await supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', post.id)
          .eq('status', 'visible');

        // Get current user's reactions
        const { data: { user: authUser } } = await supabase.auth.getUser();
        let userReacted: string[] = [];
        if (authUser) {
          const { data: myUser } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', authUser.id)
            .single();

          if (myUser) {
            const { data: myReactions } = await supabase
              .from('reactions')
              .select('type')
              .eq('target_type', 'post')
              .eq('target_id', post.id)
              .eq('user_id', myUser.id);
            userReacted = (myReactions || []).map(r => r.type);
          }
        }

        return {
          ...post,
          community: Array.isArray(post.community) ? post.community[0] : post.community,
          reaction_counts: reactionCounts as Record<string, number>,
          comment_count: count || 0,
          user_reacted: userReacted,
        } as PostWithCommunity;
      })
    );

    const nextCursor = enrichedPosts.length === limit
      ? enrichedPosts[enrichedPosts.length - 1].created_at
      : null;

    return { success: true, data: { posts: enrichedPosts, nextCursor } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch posts';
    return { success: false, error: message };
  }
}

export async function getPostDetail(
  postId: string
): Promise<ServerActionResponse<PostWithCommunity>> {
  try {
    const supabase = await createClient();

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        community:communities!inner(id, name)
      `)
      .eq('id', postId)
      .single();

    if (error) throw error;

    // Get reaction counts
    const { data: reactions } = await supabase
      .from('reactions')
      .select('type')
      .eq('target_type', 'post')
      .eq('target_id', post.id);

    const reactionCounts: Record<string, number> = {};
    (reactions || []).forEach(r => {
      reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
    });

    // Get comment count
    const { count } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', post.id)
      .eq('status', 'visible');

    // Get current user's reactions
    const { data: { user: authUser } } = await supabase.auth.getUser();
    let userReacted: string[] = [];
    if (authUser) {
      const { data: myUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (myUser) {
        const { data: myReactions } = await supabase
          .from('reactions')
          .select('type')
          .eq('target_type', 'post')
          .eq('target_id', post.id)
          .eq('user_id', myUser.id);
        userReacted = (myReactions || []).map(r => r.type);
      }
    }

    return {
      success: true,
      data: {
        ...post,
        community: Array.isArray(post.community) ? post.community[0] : post.community,
        reaction_counts: reactionCounts as Record<string, number>,
        comment_count: count || 0,
        user_reacted: userReacted,
      } as PostWithCommunity,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch post';
    return { success: false, error: message };
  }
}
