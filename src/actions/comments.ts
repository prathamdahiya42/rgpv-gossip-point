'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/session';
import { commentSchema } from '@/lib/validation';
import type { ServerActionResponse, CommentView } from '@/types';

export async function createComment(
  postId: string,
  body: string,
  parentId?: string
): Promise<ServerActionResponse<{ id?: string }>> {
  try {
    const validated = commentSchema.safeParse({ postId, body: body.trim() });
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0]?.message || 'Invalid comment' };
    }

    const profile = await requireProfile();
    const supabase = await createClient();

    // Check rate limit: max 30 comments per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', profile.id)
      .gt('created_at', oneHourAgo);

    if (!countError && count !== null && count >= 30) {
      return { success: false, error: 'Rate limit reached: max 30 comments per hour' };
    }

    // Try inserting with parent_id, fallback without if column not yet in DB
    const insertPayload: Record<string, any> = {
      post_id: validated.data.postId,
      author_id: profile.id,
      body: validated.data.body,
    };
    if (parentId) {
      insertPayload.parent_id = parentId;
    }

    let insertRes = await supabase.from('comments').insert(insertPayload).select('id').maybeSingle();

    if (insertRes.error) {
      console.warn('Comment insert note, retrying with fallback:', insertRes.error.message);
      delete insertPayload.parent_id;
      insertRes = await supabase.from('comments').insert(insertPayload).select('id').maybeSingle();
      if (insertRes.error) {
        throw new Error(insertRes.error.message);
      }
    }

    return { success: true, data: { id: insertRes.data?.id } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to post comment';
    console.error('createComment error:', message);
    return { success: false, error: message };
  }
}

export async function getComments(postId: string): Promise<ServerActionResponse<CommentView[]>> {
  try {
    const supabase = await createClient();

    let rawData: any[] | null = null;

    // 1. Query non-hidden comments (attempt with parent_id)
    const primary = await supabase
      .from('comments')
      .select('id, post_id, author_id, parent_id, body, created_at, is_hidden')
      .eq('post_id', postId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true });

    if (!primary.error) {
      rawData = primary.data;
    } else {
      // 2. If parent_id column does not exist in DB, fallback to query without parent_id
      const fallback = await supabase
        .from('comments')
        .select('id, post_id, author_id, body, created_at, is_hidden')
        .eq('post_id', postId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: true });

      if (fallback.error) throw fallback.error;
      rawData = fallback.data;
    }

    // Fetch author handles safely
    const authorIds = Array.from(new Set((rawData || []).map((r: any) => r.author_id).filter(Boolean)));
    const handleMap = new Map<string, string>();
    if (authorIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, handle')
        .in('id', authorIds);
      (profs || []).forEach(p => handleMap.set(p.id, p.handle));
    }

    // Build threaded comments (parent comments with 1-level nested replies)
    const rawComments: CommentView[] = (rawData || []).map((row: any) => ({
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
