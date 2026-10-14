'use server';

import { createClient } from '@/lib/supabase/server';
import { generateRandomHandle } from '@/lib/handles';
import type { Profile, ServerActionResponse } from '@/types';

export async function getOrCreateAnonProfile(fallbackHandle?: string): Promise<ServerActionResponse<Profile>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No anonymous user session found' };
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      return { success: true, data: existingProfile };
    }

    // Create new profile with random handle
    const handle = fallbackHandle || generateRandomHandle();
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        handle,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return { success: true, data: newProfile };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to initialize profile';
    return { success: false, error: message };
  }
}

export async function rerollHandle(): Promise<ServerActionResponse<Profile>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    // Rate limit: 1 hour since last change
    if (profile.handle_changed_at) {
      const lastChange = new Date(profile.handle_changed_at).getTime();
      const diffHours = (Date.now() - lastChange) / (1000 * 60 * 60);
      if (diffHours < 1) {
        const remainingMinutes = Math.ceil((1 - diffHours) * 60);
        return {
          success: false,
          error: `You can change handle again in ${remainingMinutes}m`,
        };
      }
    }

    const newHandle = generateRandomHandle();
    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({
        handle: newHandle,
        handle_changed_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return { success: true, data: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reroll handle';
    return { success: false, error: message };
  }
}
