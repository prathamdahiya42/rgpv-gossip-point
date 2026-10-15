'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getOrCreateAnonProfile, rerollHandle as rerollHandleAction } from '@/actions/profile';
import { generateRandomHandle } from '@/lib/handles';
import type { Profile } from '@/types';

interface AnonContextType {
  profile: Profile | null;
  loading: boolean;
  authError: string | null;
  activeCount: number;
  rerollHandle: () => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  retryInit: () => Promise<void>;
}

const AnonContext = createContext<AnonContextType>({
  profile: null,
  loading: true,
  authError: null,
  activeCount: 9,
  rerollHandle: async () => ({ success: false }),
  refreshProfile: async () => {},
  retryInit: async () => {},
});

export function AnonProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeCount, setActiveCount] = useState<number>(9);

  const initSessionAndProfile = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      let { data: { user }, error: getUserError } = await supabase.auth.getUser();

      if (getUserError) {
        // User check failed, possibly expired or invalid session token
        console.warn('getUser check:', getUserError.message);
      }

      if (!user) {
        // Silently sign in anonymously
        const { data: anonAuth, error: signError } = await supabase.auth.signInAnonymously();
        if (signError) {
          console.warn('Silent sign-in note:', signError.message);
          setAuthError(signError.message);
        } else {
          user = anonAuth.user;
          setAuthError(null);
        }
      }

      if (user) {
        setAuthError(null);
        // Check if profile exists directly via Supabase client
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (existingProfile) {
          setProfile(existingProfile as Profile);
        } else {
          // Attempt client insert with fallback to server action
          const newHandle = generateRandomHandle();
          const { data: created, error: insertError } = await supabase
            .from('profiles')
            .insert({ id: user.id, handle: newHandle })
            .select()
            .single();

          if (!insertError && created) {
            setProfile(created as Profile);
          } else {
            const res = await getOrCreateAnonProfile(newHandle);
            if (res.success && res.data) {
              setProfile(res.data);
            }
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to Supabase';
      console.error('Failed to init anon session:', msg);
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const res = await getOrCreateAnonProfile();
    if (res.success && res.data) {
      setProfile(res.data);
    }
  }, []);

  const reroll = useCallback(async () => {
    const res = await rerollHandleAction();
    if (res.success && res.data) {
      setProfile(res.data);
      return { success: true };
    }
    return { success: false, error: res.error };
  }, []);

  useEffect(() => {
    initSessionAndProfile();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && !profile) {
        initSessionAndProfile();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initSessionAndProfile, profile]);

  // Live campus presence channel with realistic student activity multiplier
  useEffect(() => {
    const supabase = createClient();
    const presenceKey = profile?.id || `anon_${Math.random().toString(36).slice(2, 9)}`;

    const channel = supabase.channel('rgpv-presence', {
      config: {
        presence: { key: presenceKey },
      },
    });

    const calculateBoostedCount = (realUsers: number) => {
      const minute = new Date().getMinutes();
      const subtleJitter = (minute % 3) - 1; // -1, 0, or 1
      // When real is 4 -> 9-10; when real is 7 -> 13-14
      const base = Math.round(realUsers * 1.3) + 4;
      return Math.max(8, base + subtleJitter);
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const real = Object.keys(state).length;
        setActiveCount(calculateBoostedCount(real));
      })
      .on('presence', { event: 'join' }, () => {
        const state = channel.presenceState();
        const real = Object.keys(state).length;
        setActiveCount(calculateBoostedCount(real));
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState();
        const real = Object.keys(state).length;
        setActiveCount(calculateBoostedCount(real));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
          });
        }
      });

    const interval = setInterval(() => {
      const state = channel.presenceState();
      const real = Object.keys(state).length;
      setActiveCount(calculateBoostedCount(real));
    }, 30000);

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, [profile?.id]);

  return (
    <AnonContext.Provider value={{ profile, loading, authError, activeCount, rerollHandle: reroll, refreshProfile, retryInit: initSessionAndProfile }}>
      {children}
    </AnonContext.Provider>
  );
}

export function useAnon() {
  const context = useContext(AnonContext);
  if (!context) {
    throw new Error('useAnon must be used within an AnonProvider');
  }
  return context;
}
