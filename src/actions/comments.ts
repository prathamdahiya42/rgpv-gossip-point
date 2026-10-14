'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/session';
import { commentSchema } from '@/lib/validation';
import type { ServerActionResponse, CommentView } from '@/types';

export async function createComment(
  postId: string,
  body: string
): Promise<ServerActionResponse> {
  try {
    const profile = await requireProfile();
    const validated = commentSchema.safeParse({ postId, body: body.trim() });

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || 'Invalid comment' };
    }

    const supabase = await createClient();

    // Check rate limit: max 20 comments per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', profile.id)
      .gt('created_at', oneHourAgo);

    if (!countError && count !== null && count >= 20) {
      return { success: false, error: 'Rate limit reached: max 20 comments per hour' };
    }

    const { error: insertError } = await supabase
      .from('comments')
      .insert({
        post_id: validated.data.postId,
        author_id: profile.id,
        body: validated.data.body,
      });

    if (insertError) throw insertError;

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to post comment';
    return { success: false, error: message };
  }
}

export async function getComments(postId: string): Promise<ServerActionResponse<CommentView[]>> {
  try {
    const supabase = await createClient();

    // Query non-hidden comments joining profiles to get handle without exposing author_id
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        post_id,
        body,
        created_at,
        profiles!inner(handle)
      `)
      .eq('post_id', postId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const comments: CommentView[] = (data || []).map((row: any) => ({
      id: row.id,
      post_id: row.post_id,
      body: row.body,
      created_at: row.created_at,
      handle: row.profiles?.handle || 'Anonymous',
    }));

    return { success: true, data: comments };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch comments';
    return { success: false, error: message };
  }
}
