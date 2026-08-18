import { createClient } from '@/lib/supabase/server';
import type { User } from '@/types';

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authUser.id)
    .single();

  return user;
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  if (user.is_banned) {
    throw new Error('Your account has been banned');
  }
  return user;
}

export async function requireVerified(): Promise<User> {
  const user = await requireAuth();
  if (user.tier !== 'verified') {
    throw new Error('Verified account required to perform this action');
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (!user.is_admin) {
    throw new Error('Admin access required');
  }
  return user;
}
