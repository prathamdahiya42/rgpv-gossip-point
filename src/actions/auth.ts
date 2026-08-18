'use server';

import { createClient } from '@/lib/supabase/server';
import type { ServerActionResponse, User } from '@/types';

export async function createChatUser(
  pseudonym: string,
  deviceFingerprint: string
): Promise<ServerActionResponse<User>> {
  try {
    const supabase = await createClient();

    // Sign in anonymously
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create anonymous session');

    // Create user row in public.users
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        pseudonym: pseudonym.trim(),
        tier: 'chat',
        device_fingerprint: deviceFingerprint,
      })
      .select()
      .single();

    if (userError) throw userError;

    return { success: true, data: user };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create account';
    return { success: false, error: message };
  }
}

export async function sendOtp(phone: string): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithOtp({
      phone: phone.trim(),
    });

    if (error) throw error;

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send OTP';
    return { success: false, error: message };
  }
}

export async function verifyOtpAndUpgrade(
  phone: string,
  token: string,
  deviceFingerprint: string
): Promise<ServerActionResponse<User>> {
  try {
    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: token.trim(),
      type: 'sms',
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('OTP verification failed');

    // Hash the phone number for block-matching
    const phoneHash = await hashPhone(phone);

    // Check if user already exists (upgrading from chat tier)
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authData.user.id)
      .single();

    if (existingUser) {
      // Upgrade existing chat user to verified
      const { data: user, error: updateError } = await supabase
        .from('users')
        .update({
          tier: 'verified',
          phone_hash: phoneHash,
          device_fingerprint: deviceFingerprint,
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return { success: true, data: user };
    }

    // New verified user (direct phone signup)
    const pseudonym = `anon_${Math.random().toString(36).slice(2, 8)}`;
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        pseudonym,
        tier: 'verified',
        phone_hash: phoneHash,
        device_fingerprint: deviceFingerprint,
      })
      .select()
      .single();

    if (userError) throw userError;
    return { success: true, data: user };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    return { success: false, error: message };
  }
}

export async function updatePseudonym(
  newPseudonym: string
): Promise<ServerActionResponse<User>> {
  try {
    const supabase = await createClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('Not authenticated');

    const { data: user, error } = await supabase
      .from('users')
      .update({ pseudonym: newPseudonym.trim() })
      .eq('auth_id', authUser.id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: user };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update pseudonym';
    return { success: false, error: message };
  }
}

export async function signOut(): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sign out';
    return { success: false, error: message };
  }
}

// Hash phone number with SHA-256 for block-matching
async function hashPhone(phone: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(phone.trim().replace(/\s/g, ''));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
