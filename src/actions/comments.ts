'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/session';
import type { ServerActionResponse, Comment, CommentWithReactions } from '@/types';

export async function createComment(
  postId: string,
  content: string
): Promise<ServerActionResponse<Comment>> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        pseudonym_shown: user.pseudonym,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: comment };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create comment';
    return { success: false, error: message };
  }
}

export async function getComments(
  postId: string,
  cursor?: string,
  limit: number = 50
): Promise<ServerActionResponse<{ comments: CommentWithReactions[]; nextCursor: string | null }>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .eq('status', 'visible')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (cursor) {
      query = query.gt('created_at', cursor);
    }

    const { data: comments, error } = await query;
    if (error) throw error;

    // Get current user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    let currentUserId: string | null = null;
    if (authUser) {
      const { data: myUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();
      currentUserId = myUser?.id || null;
    }

    // Enrich with reactions
    const enrichedComments: CommentWithReactions[] = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: reactions } = await supabase
          .from('reactions')
          .select('type, user_id')
          .eq('target_type', 'comment')
          .eq('target_id', comment.id);

        const reactionCounts: Record<string, number> = {};
        const userReacted: string[] = [];
        (reactions || []).forEach(r => {
          reactionCounts[r.type] = (reactionCounts[r.type] || 0) + 1;
          if (r.user_id === currentUserId) userReacted.push(r.type);
        });

        return {
          ...comment,
          reaction_counts: reactionCounts,
          user_reacted: userReacted,
        } as CommentWithReactions;
      })
    );

    const nextCursor = enrichedComments.length === limit
      ? enrichedComments[enrichedComments.length - 1].created_at
      : null;

    return { success: true, data: { comments: enrichedComments, nextCursor } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch comments';
    return { success: false, error: message };
  }
}
