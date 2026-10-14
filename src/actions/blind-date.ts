'use server';

import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth/session';
import { containsContactInfo } from '@/lib/validation';
import type { ServerActionResponse, BlindDateMode } from '@/types';

export interface MatchInfo {
  matchId: string;
  partnerHandle: string;
  partnerId: string; // Internal for reporting only, kept opaque
  mode: BlindDateMode;
  vibe?: string | null;
  startedAt: string;
  endsAt: string;
  leftAt: string | null;
  serverTime: string;
}

import { parseYouTubeId } from '@/lib/music';

export async function joinBlindDate(
  mode: BlindDateMode = 'general',
  vibe?: string
): Promise<
  ServerActionResponse<{ status: 'waiting' | 'matched'; matchId: string | null; endsAt: string | null }>
> {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();

    // Call join_blind_date with mode and vibe parameter (with fallbacks)
    let { data, error } = await supabase.rpc('join_blind_date', {
      p_mode: mode,
      p_vibe: vibe || null,
    });

    if (error && (error.message.includes('p_vibe') || error.message.includes('function'))) {
      const fallbackWithMode = await supabase.rpc('join_blind_date', { p_mode: mode });
      if (fallbackWithMode.error && fallbackWithMode.error.message.includes('p_mode')) {
        const pureFallback = await supabase.rpc('join_blind_date');
        data = pureFallback.data;
        error = pureFallback.error;
      } else {
        data = fallbackWithMode.data;
        error = fallbackWithMode.error;
      }
    }

    if (error) throw error;

    return {
      success: true,
      data: {
        status: data?.status || 'waiting',
        matchId: data?.match_id || null,
        endsAt: data?.ends_at || null,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to join Blind Date queue';
    return { success: false, error: message };
  }
}

export async function cancelBlindDate(): Promise<ServerActionResponse> {
  try {
    await requireProfile();
    const supabase = await createClient();
    const { error } = await supabase.rpc('cancel_blind_date');
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to cancel search';
    return { success: false, error: message };
  }
}

export async function leaveBlindDate(matchId: string): Promise<ServerActionResponse> {
  try {
    await requireProfile();
    const supabase = await createClient();
    const { error } = await supabase.rpc('leave_blind_date', { p_match_id: matchId });
    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to leave chat';
    return { success: false, error: message };
  }
}

export async function getMatchInfo(matchId: string): Promise<ServerActionResponse<MatchInfo>> {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();

    const { data: match, error } = await supabase
      .from('matches')
      .select('id, user_a, user_b, mode, started_at, ends_at, left_at')
      .eq('id', matchId)
      .single();

    if (error || !match) {
      throw new Error('Match not found or expired');
    }

    if (match.user_a !== profile.id && match.user_b !== profile.id) {
      throw new Error('Not authorized to view this match');
    }

    const partnerId = match.user_a === profile.id ? match.user_b : match.user_a;

    // Fetch partner handle
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('handle')
      .eq('id', partnerId)
      .single();

    return {
      success: true,
      data: {
        matchId: match.id,
        partnerHandle: partnerProfile?.handle || 'Mystery Stranger',
        partnerId,
        mode: (match.mode as BlindDateMode) || 'general',
        startedAt: match.started_at,
        endsAt: match.ends_at,
        leftAt: match.left_at,
        serverTime: new Date().toISOString(),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get match details';
    return { success: false, error: message };
  }
}

export async function sendMatchMessage(
  matchId: string,
  body: string
): Promise<ServerActionResponse> {
  try {
    const profile = await requireProfile();
    const cleanBody = body.trim();

    if (!cleanBody || cleanBody.length < 1) {
      return { success: false, error: 'Message cannot be empty' };
    }
    if (cleanBody.length > 300) {
      return { success: false, error: 'Message cannot exceed 300 characters' };
    }
    if (containsContactInfo(cleanBody)) {
      return { success: false, error: 'Keep it anonymous, no personal contact info.' };
    }

    const supabase = await createClient();

    // Rate limit check: ~1 message per second
    const oneSecAgo = new Date(Date.now() - 1000).toISOString();
    const { count } = await supabase
      .from('match_messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', profile.id)
      .gt('created_at', oneSecAgo);

    if (count && count >= 2) {
      return { success: false, error: 'Slow down! Max ~1 message per second' };
    }

    const { error: insertError } = await supabase
      .from('match_messages')
      .insert({
        match_id: matchId,
        sender_id: profile.id,
        body: cleanBody,
      });

    if (insertError) throw insertError;

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send message';
    return { success: false, error: message };
  }
}

export async function reportAndLeaveStranger(
  matchId: string,
  targetUserId: string,
  reason: string
): Promise<ServerActionResponse> {
  try {
    const profile = await requireProfile();
    const supabase = await createClient();

    // 1. Submit report against the user
    await supabase
      .from('reports')
      .insert({
        reporter_id: profile.id,
        target_type: 'user',
        target_id: targetUserId,
        reason: reason.trim(),
      });

    // 2. End the chat immediately for the reporter
    await supabase.rpc('leave_blind_date', { p_match_id: matchId });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to report stranger';
    return { success: false, error: message };
  }
}

export async function shareMatchTrack(
  matchId: string,
  urlOrId: string,
  title?: string
): Promise<ServerActionResponse<{ youtubeId: string; title: string }>> {
  try {
    const profile = await requireProfile();
    const ytId = parseYouTubeId(urlOrId);
    if (!ytId) {
      return { success: false, error: 'Please enter a valid YouTube video link or ID' };
    }

    const cleanTitle = (title || 'Shared Song').slice(0, 80).replace(/[|]/g, '');
    const messageBody = `[Now Playing]: ${ytId}|${cleanTitle}`;

    const supabase = await createClient();
    const { error } = await supabase.from('match_messages').insert({
      match_id: matchId,
      sender_id: profile.id,
      body: messageBody,
    });

    if (error) throw error;

    return { success: true, data: { youtubeId: ytId, title: cleanTitle } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to share track';
    return { success: false, error: message };
  }
}
