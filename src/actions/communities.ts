'use server';

import { createClient } from '@/lib/supabase/server';
import { requireVerified, requireAdmin } from '@/lib/auth/session';
import type { ServerActionResponse, Community } from '@/types';

export async function requestCommunity(
  name: string,
  description?: string
): Promise<ServerActionResponse<Community>> {
  try {
    const user = await requireVerified();
    const supabase = await createClient();

    const { data: community, error } = await supabase
      .from('communities')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        mode: 'open',
        status: 'pending',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: community };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to request community';
    return { success: false, error: message };
  }
}

export async function getCommunities(): Promise<ServerActionResponse<Community[]>> {
  try {
    const supabase = await createClient();

    const { data: communities, error } = await supabase
      .from('communities')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: communities || [] };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch communities';
    return { success: false, error: message };
  }
}

export async function getCommunityById(
  id: string
): Promise<ServerActionResponse<Community>> {
  try {
    const supabase = await createClient();

    const { data: community, error } = await supabase
      .from('communities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data: community };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Community not found';
    return { success: false, error: message };
  }
}

export async function approveCommunity(
  id: string
): Promise<ServerActionResponse> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('communities')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to approve community';
    return { success: false, error: message };
  }
}

export async function rejectCommunity(
  id: string
): Promise<ServerActionResponse> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('communities')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reject community';
    return { success: false, error: message };
  }
}
