import { createClient } from '@/lib/supabase/server';
import { generateRandomHandle } from '@/lib/handles';
import type { Profile } from '@/types';

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  let { data: { user: authUser } } = await supabase.auth.getUser();

  // If no auth cookie yet, attempt anonymous sign-in in server context
  if (!authUser) {
    try {
      const { data: anonAuth } = await supabase.auth.signInAnonymously();
      if (anonAuth?.user) {
        authUser = anonAuth.user;
      }
    } catch {
      // Ignore if sign-in cannot be completed server-side
    }
  }

  if (!authUser) return null;

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  // Auto-create profile row if auth user exists but profile row doesn't
  if (!profile) {
    const handle = generateRandomHandle();
    const { data: created } = await supabase
      .from('profiles')
      .insert({ id: authUser.id, handle })
      .select()
      .maybeSingle();

    if (created) {
      profile = created;
    }
  }

  return profile as Profile | null;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error(
      'Anonymous session required. In Supabase Dashboard: go to Authentication -> Providers -> toggle "Anonymous sign-ins" to ON, and verify your .env.local project credentials.'
    );
  }
  if (profile.is_banned) {
    throw new Error('Your account has been banned');
  }
  return profile;
}
