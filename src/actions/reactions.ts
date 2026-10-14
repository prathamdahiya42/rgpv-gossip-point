'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/session';
import type { ServerActionResponse, ReactionEmoji } from '@/types';

export async function toggleReaction(
  postId: string,
  emoji: ReactionEmoji
): Promise<ServerActionResponse<{ action: 'added' | 'removed' | 'switched' }>> {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();

    // Check existing reaction for this user on this post
    const { data: existing } = await supabase
      .from('reactions')
      .select('emoji')
      .eq('post_id', postId)
      .eq('user_id', profile.id)
      .maybeSingle();

    if (existing) {
      if (existing.emoji === emoji) {
        // Tap again to remove
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', profile.id);

        if (error) throw error;
        return { success: true, data: { action: 'removed' } };
      } else {
        // Switch to new emoji
        const { error } = await supabase
          .from('reactions')
          .update({ emoji })
          .eq('post_id', postId)
          .eq('user_id', profile.id);

        if (error) throw error;
        return { success: true, data: { action: 'switched' } };
      }
    } else {
      // Add new reaction
      const { error } = await supabase
        .from('reactions')
        .insert({
          post_id: postId,
          user_id: profile.id,
          emoji,
        });

      if (error) throw error;
      return { success: true, data: { action: 'added' } };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to toggle reaction';
    return { success: false, error: message };
  }
}
