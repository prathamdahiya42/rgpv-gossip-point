'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/session';
import type { ServerActionResponse, Community, Post, Comment, User } from '@/types';

export async function getPendingCommunities(): Promise<ServerActionResponse<Community[]>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch pending communities';
    return { success: false, error: message };
  }
}

export async function getAutoHiddenContent(): Promise<ServerActionResponse<{
  posts: Post[];
  comments: (Comment & { post_id: string })[];
}>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'auto_hidden')
      .order('created_at', { ascending: true });

    if (postsError) throw postsError;

    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('status', 'auto_hidden')
      .order('created_at', { ascending: true });

    if (commentsError) throw commentsError;

    return {
      success: true,
      data: {
        posts: posts || [],
        comments: comments || [],
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch reported content';
    return { success: false, error: message };
  }
}

export async function getBanList(): Promise<ServerActionResponse<User[]>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_banned', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch ban list';
    return { success: false, error: message };
  }
}

export async function banUser(userId: string): Promise<ServerActionResponse> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('users')
      .update({ is_banned: true })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to ban user';
    return { success: false, error: message };
  }
}

export async function unbanUser(userId: string): Promise<ServerActionResponse> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('users')
      .update({ is_banned: false })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to unban user';
    return { success: false, error: message };
  }
}

export async function restoreContent(
  targetType: 'post' | 'comment',
  targetId: string
): Promise<ServerActionResponse> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const table = targetType === 'post' ? 'posts' : 'comments';
    const { error } = await supabase
      .from(table)
      .update({ status: 'visible', report_count: 0 })
      .eq('id', targetId);

    if (error) throw error;

    // Resolve all reports for this content
    await supabase
      .from('reports')
      .update({ resolved: true })
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to restore content';
    return { success: false, error: message };
  }
}

export async function removeContent(
  targetType: 'post' | 'comment',
  targetId: string
): Promise<ServerActionResponse> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const table = targetType === 'post' ? 'posts' : 'comments';
    const { error } = await supabase
      .from(table)
      .update({ status: 'removed' })
      .eq('id', targetId);

    if (error) throw error;

    // Resolve all reports for this content
    await supabase
      .from('reports')
      .update({ resolved: true })
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove content';
    return { success: false, error: message };
  }
}
