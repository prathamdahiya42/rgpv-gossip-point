'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/session';
import type { ServerActionResponse, User } from '@/types';

export async function blockUser(
  blockedUserId: string
): Promise<ServerActionResponse> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    if (user.id === blockedUserId) {
      return { success: false, error: "You can't block yourself" };
    }

    // Get the blocked user's info for sticky blocking
    const { data: blockedUser, error: fetchError } = await supabase
      .from('users')
      .select('device_fingerprint, phone_hash')
      .eq('id', blockedUserId)
      .single();

    if (fetchError || !blockedUser) throw new Error('User not found');

    const { error } = await supabase
      .from('blocks')
      .insert({
        blocker_id: user.id,
        blocked_id: blockedUserId,
        blocked_device_fingerprint: blockedUser.device_fingerprint,
        blocked_phone_hash: blockedUser.phone_hash,
      });

    if (error) {
      // Unique constraint violation = already blocked
      if (error.code === '23505') {
        return { success: true };
      }
      throw error;
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to block user';
    return { success: false, error: message };
  }
}

export async function unblockUser(
  blockedUserId: string
): Promise<ServerActionResponse> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', blockedUserId);

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to unblock user';
    return { success: false, error: message };
  }
}

export async function getBlockedUsers(): Promise<ServerActionResponse<Array<{ id: string; pseudonym: string }>>> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: blocks, error } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id);

    if (error) throw error;

    if (!blocks || blocks.length === 0) {
      return { success: true, data: [] };
    }

    const blockedIds = blocks.map(b => b.blocked_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, pseudonym')
      .in('id', blockedIds);

    if (usersError) throw usersError;

    return { success: true, data: (users as Pick<User, 'id' | 'pseudonym'>[]) || [] };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get blocked users';
    return { success: false, error: message };
  }
}
