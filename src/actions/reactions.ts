'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/session';
import type { ServerActionResponse, ReactionEmoji } from '@/types';

export async function toggleReaction(
  targetType: 'post' | 'comment',
  targetId: string,
  emojiType: ReactionEmoji
): Promise<ServerActionResponse<{ added: boolean }>> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Check if reaction already exists
    const { data: existing } = await supabase
      .from('reactions')
      .select('id')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('user_id', user.id)
      .eq('type', emojiType)
      .single();

    if (existing) {
      // Remove reaction
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;
      return { success: true, data: { added: false } };
    } else {
      // Add reaction
      const { error } = await supabase
        .from('reactions')
        .insert({
          target_type: targetType,
          target_id: targetId,
          user_id: user.id,
          type: emojiType,
        });

      if (error) throw error;
      return { success: true, data: { added: true } };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to toggle reaction';
    return { success: false, error: message };
  }
}
