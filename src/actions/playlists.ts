'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/session';
import type { ServerActionResponse, Playlist } from '@/types';

export async function getPlaylist(
  communityId?: string | null
): Promise<ServerActionResponse<Playlist | null>> {
  try {
    const supabase = await createClient();

    let query = supabase.from('playlists').select('*');

    if (communityId) {
      query = query.eq('community_id', communityId);
    } else {
      query = query.is('community_id', null);
    }

    const { data: playlists, error } = await query.limit(1);
    if (error) throw error;

    return { success: true, data: playlists && playlists.length > 0 ? playlists[0] : null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch playlist';
    return { success: false, error: message };
  }
}

export async function getAllPlaylists(): Promise<ServerActionResponse<Playlist[]>> {
  try {
    const supabase = await createClient();

    const { data: playlists, error } = await supabase
      .from('playlists')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, data: playlists || [] };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch playlists';
    return { success: false, error: message };
  }
}

export async function createPlaylist(
  title: string,
  communityId?: string | null
): Promise<ServerActionResponse<Playlist>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: playlist, error } = await supabase
      .from('playlists')
      .insert({
        title: title.trim(),
        community_id: communityId || null,
        tracks: [],
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: playlist };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create playlist';
    return { success: false, error: message };
  }
}

export async function addTrackToPlaylist(
  playlistId: string,
  track: { title: string; url: string; platform: 'spotify' | 'youtube' | 'other' }
): Promise<ServerActionResponse> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Get current playlist
    const { data: playlist, error: fetchError } = await supabase
      .from('playlists')
      .select('tracks')
      .eq('id', playlistId)
      .single();

    if (fetchError || !playlist) throw new Error('Playlist not found');

    const tracks = [...(playlist.tracks as Array<Record<string, unknown>>), { ...track, approved: true }];

    const { error } = await supabase
      .from('playlists')
      .update({ tracks })
      .eq('id', playlistId);

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add track';
    return { success: false, error: message };
  }
}
