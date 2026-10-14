'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/session';
import { commentSchema } from '@/lib/validation';
import type { ServerActionResponse, CommentView } from '@/types';

export async function createComment(
  postId: string,
  body: string,
  parentId?: string
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

    // Try inserting with parent_id, fallback without if column not yet migrated
    const insertPayload: Record<string, any> = {
      post_id: validated.data.postId,
      author_id: profile.id,
      body: validated.data.body,
    };
    if (parentId) {
      insertPayload.parent_id = parentId;
    }

    const { error: insertError } = await supabase
      .from('comments')
      .insert(insertPayload);

    if (insertError) {
      // If error was missing parent_id column, retry without parent_id
      if (parentId && insertError.message?.includes('parent_id')) {
        const { error: retryError } = await supabase.from('comments').insert({
          post_id: validated.data.postId,
          author_id: profile.id,
          body: validated.data.body,
        });
        if (retryError) throw retryError;
      } else {
        throw insertError;
      }
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to post comment';
    return { success: false, error: message };
  }
}

export async function getComments(postId: string): Promise<ServerActionResponse<CommentView[]>> {
  try {
    const supabase = await createClient();

    // Query non-hidden comments
    const { data, error } = await supabase
      .from('comments')
      .select('id, post_id, author_id, parent_id, body, created_at, is_hidden')
      .eq('post_id', postId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Fetch author handles safely
    const authorIds = Array.from(new Set((data || []).map((r: any) => r.author_id).filter(Boolean)));
    const handleMap = new Map<string, string>();
    if (authorIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, handle')
        .in('id', authorIds);
      (profs || []).forEach(p => handleMap.set(p.id, p.handle));
    }

    // Build threaded comments (parent comments with 1-level nested replies)
    const rawComments: CommentView[] = (data || []).map((row: any) => ({
      id: row.id,
      post_id: row.post_id,
      parent_id: row.parent_id || null,
      body: row.body,
      created_at: row.created_at,
      handle: handleMap.get(row.author_id) || 'Anonymous',
      replies: [],
    }));

    const topLevel: CommentView[] = [];
    const commentMap = new Map<string, CommentView>();

    rawComments.forEach((c) => {
      commentMap.set(c.id, c);
    });

    rawComments.forEach((c) => {
      if (c.parent_id && commentMap.has(c.parent_id)) {
        const parent = commentMap.get(c.parent_id)!;
        parent.replies = parent.replies || [];
        parent.replies.push(c);
      } else {
        topLevel.push(c);
      }
    });

    return { success: true, data: topLevel };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch comments';
    return { success: false, error: message };
  }
}
