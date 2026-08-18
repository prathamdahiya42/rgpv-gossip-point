'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/session';
import type { ServerActionResponse, DmThread, DmMessage } from '@/types';

export async function startDm(
  otherUserId: string
): Promise<ServerActionResponse<{ dmId: string }>> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    if (user.id === otherUserId) {
      return { success: false, error: "You can't DM yourself" };
    }

    // Check if blocked
    const { data: blocked } = await supabase
      .from('blocks')
      .select('id')
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${user.id})`)
      .limit(1);

    if (blocked && blocked.length > 0) {
      return { success: false, error: 'Unable to start conversation' };
    }

    // Use the get_or_create_dm function
    const { data: dmId, error } = await supabase
      .rpc('get_or_create_dm', {
        p_user_a: user.id,
        p_user_b: otherUserId,
      });

    if (error) throw error;
    return { success: true, data: { dmId } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start DM';
    return { success: false, error: message };
  }
}

export async function sendMessage(
  dmId: string,
  content: string
): Promise<ServerActionResponse<DmMessage>> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: message, error } = await supabase
      .from('dm_messages')
      .insert({
        dm_id: dmId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send message';
    return { success: false, error: message };
  }
}

export async function getDmThreads(): Promise<ServerActionResponse<DmThread[]>> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: dms, error } = await supabase
      .from('dms')
      .select('*')
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const threads: DmThread[] = await Promise.all(
      (dms || []).map(async (dm) => {
        const otherUserId = dm.participant_a === user.id ? dm.participant_b : dm.participant_a;

        // Get other user info
        const { data: otherUser } = await supabase
          .from('users')
          .select('id, pseudonym, tier')
          .eq('id', otherUserId)
          .single();

        // Get last message
        const { data: lastMessages } = await supabase
          .from('dm_messages')
          .select('content, created_at')
          .eq('dm_id', dm.id)
          .order('created_at', { ascending: false })
          .limit(1);

        return {
          ...dm,
          other_user: otherUser || { id: otherUserId, pseudonym: 'Unknown', tier: 'chat' as const },
          last_message: lastMessages && lastMessages.length > 0 ? lastMessages[0] : null,
        };
      })
    );

    // Sort by last message time
    threads.sort((a, b) => {
      const aTime = a.last_message?.created_at || a.created_at;
      const bTime = b.last_message?.created_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return { success: true, data: threads };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch DMs';
    return { success: false, error: message };
  }
}

export async function getDmMessages(
  dmId: string,
  cursor?: string,
  limit: number = 50
): Promise<ServerActionResponse<{ messages: DmMessage[]; nextCursor: string | null }>> {
  try {
    await requireAuth();
    const supabase = await createClient();

    let query = supabase
      .from('dm_messages')
      .select('*')
      .eq('dm_id', dmId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: messages, error } = await query;
    if (error) throw error;

    const reversed = (messages || []).reverse();
    const nextCursor = messages && messages.length === limit
      ? messages[messages.length - 1].created_at
      : null;

    return { success: true, data: { messages: reversed, nextCursor } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch messages';
    return { success: false, error: message };
  }
}
