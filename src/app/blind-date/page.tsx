'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  joinBlindDate,
  cancelBlindDate,
  getMatchInfo,
  type MatchInfo,
} from '@/actions/blind-date';
import BlindDateChat from '@/components/features/BlindDateChat';
import Button from '@/components/ui/Button';
import { useAnon } from '@/context/AnonContext';
import { useToast } from '@/context/ToastContext';
import type { BlindDateMode, MusicVibe } from '@/types';
import { MUSIC_VIBES } from '@/types';

type BlindDateState = 'landing' | 'searching' | 'timeout' | 'chat' | 'ended';

export default function BlindDatePage() {
  const { profile } = useAnon();
  const { showToast } = useToast();

  const [state, setState] = useState<BlindDateState>('landing');
  const [mode, setMode] = useState<BlindDateMode>('general');
  const [selectedVibe, setSelectedVibe] = useState<MusicVibe>('rap');
  const [is18Plus, setIs18Plus] = useState<boolean>(false);
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [endReason, setEndReason] = useState<'timeout' | 'left' | 'reported' | null>(null);
  const [searchSeconds, setSearchSeconds] = useState(0);

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check 18+ verification from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rgpv_blind_date_18_plus');
      if (stored === 'true') {
        setIs18Plus(true);
      }
    }
  }, []);

  const handleCheckboxChange = (checked: boolean) => {
    setIs18Plus(checked);
    if (checked) {
      localStorage.setItem('rgpv_blind_date_18_plus', 'true');
    }
  };

  // Switch to chat with loaded match
  const setupChat = useCallback(async (matchId: string) => {
    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    const res = await getMatchInfo(matchId);
    if (res.success && res.data) {
      setMatchInfo(res.data);
      setState('chat');
    } else {
      showToast(res.error || 'Failed to initialize chat session', 'error');
      setState('landing');
    }
  }, [showToast]);

  // Start Searching
  const startSearching = async () => {
    if (!is18Plus) {
      showToast('Please confirm you are 18 or older to use Blind Date', 'error');
      return;
    }

    setState('searching');
    setSearchSeconds(0);
    setEndReason(null);

    // Initial join attempt with selected mode & vibe
    const vibeParam = mode === 'music' ? selectedVibe : undefined;
    const res = await joinBlindDate(mode, vibeParam);
    if (res.success && res.data) {
      if (res.data.status === 'matched' && res.data.matchId) {
        setupChat(res.data.matchId);
        return;
      }
    } else {
      showToast(res.error || 'Failed to enter matchmaking queue', 'error');
      setState('landing');
      return;
    }

    // 45s timer
    const startTime = Date.now();
    searchTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setSearchSeconds(elapsed);

      if (elapsed >= 45) {
        if (searchTimerRef.current) clearInterval(searchTimerRef.current);
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        cancelBlindDate();
        setState('timeout');
      }
    }, 1000);

    // Fallback poll every 3s
    pollTimerRef.current = setInterval(async () => {
      const pollRes = await joinBlindDate(mode, vibeParam);
      if (pollRes.success && pollRes.data?.status === 'matched' && pollRes.data.matchId) {
        setupChat(pollRes.data.matchId);
      }
    }, 3000);
  };

  // Realtime subscription for incoming matches
  useEffect(() => {
    if (state !== 'searching' || !profile?.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`blind-date-queue-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
        },
        (payload: any) => {
          if (payload.new?.user_a === profile.id || payload.new?.user_b === profile.id) {
            setupChat(payload.new.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state, profile?.id, setupChat]);

  // Cancel search
  const handleCancelSearch = async () => {
    if (searchTimerRef.current) clearInterval(searchTimerRef.current);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    await cancelBlindDate();
    setState('landing');
  };

  // Handle chat session end
  const handleChatEnd = (reason: 'timeout' | 'left' | 'reported') => {
    setEndReason(reason);
    setState('ended');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearInterval(searchTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // ── 1. ACTIVE CHAT STATE ────────────────────────────────────
  if (state === 'chat' && matchInfo) {
    return (
      <div className="px-4 py-4">
        <BlindDateChat matchInfo={matchInfo} onEnd={handleChatEnd} />
      </div>
    );
  }

  // ── 2. SEARCHING STATE ──────────────────────────────────────
  if (state === 'searching') {
    return (
      <div className="px-4 py-16 text-center max-w-sm mx-auto">
        <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
            mode === 'garba'
              ? 'bg-amber-400/30'
              : mode === 'music'
              ? 'bg-purple-500/30'
              : 'bg-coral/20'
          }`} />
          <div className={`relative w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-md border ${
            mode === 'garba'
              ? 'bg-amber-100 border-amber-300'
              : mode === 'music'
              ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-400'
              : 'bg-coral-soft border-coral/30'
          }`}>
            {mode === 'garba' ? '🪩' : mode === 'music' ? '🎧' : '💘'}
          </div>
        </div>

        <h2 className="font-display text-xl font-bold text-ink mb-1.5 animate-pulse">
          {mode === 'garba'
            ? 'Finding Garba partner...'
            : mode === 'music'
            ? 'Matching music vibe...'
            : 'Finding someone...'}
        </h2>
        <p className="font-body text-xs text-ink-soft mb-3">
          {mode === 'garba'
            ? 'Pairing you with another student attending Garba fest...'
            : mode === 'music'
            ? `Searching for another student listening to ${MUSIC_VIBES.find(v => v.id === selectedVibe)?.label || 'music'}...`
            : 'Searching for an active student across RGPV...'}
        </p>

        <div className={`font-mono text-xs font-bold mb-8 ${
          mode === 'garba' ? 'text-amber-700' : mode === 'music' ? 'text-purple-600' : 'text-coral'
        }`}>
          0:{Math.max(0, 45 - searchSeconds).toString().padStart(2, '0')} remaining
        </div>

        <Button variant="ghost" onClick={handleCancelSearch} className="w-full">
          Cancel Search
        </Button>
      </div>
    );
  }

  // ── 3. TIMEOUT SCREEN (NOBODY AROUND) ─────────────────────────
  if (state === 'timeout') {
    return (
      <div className="px-4 py-16 text-center max-w-sm mx-auto animate-scale-up">
        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-ink/5 flex items-center justify-center text-3xl">
          ⏳
        </div>
        <h2 className="font-display text-xl font-bold text-ink mb-2">
          Nobody&apos;s around right now
        </h2>
        <p className="font-body text-xs text-ink-soft mb-8 leading-relaxed">
          {mode === 'garba'
            ? 'No one else is searching for a Garba match this second. Try again or check the Garba feed!'
            : mode === 'music'
            ? 'Nobody else with this exact music vibe is searching right now. Try switching genres or switch to Random Chat!'
            : 'The campus might be asleep or in lectures. Try again or check the gossip feed!'}
        </p>

        <div className="space-y-3">
          <Button onClick={startSearching} className="w-full" size="lg">
            Try again 🔄
          </Button>
          <Link href="/" className="block">
            <Button variant="secondary" className="w-full">
              Back to Feed
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── 4. CHAT ENDED SCREEN ─────────────────────────────────────
  if (state === 'ended') {
    return (
      <div className="px-4 py-16 text-center max-w-sm mx-auto animate-scale-up">
        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-coral-soft text-coral flex items-center justify-center text-3xl">
          {endReason === 'timeout' ? '⏰' : endReason === 'reported' ? '🛡️' : '🏃'}
        </div>

        <h2 className="font-display text-2xl font-bold text-ink mb-2">
          {endReason === 'timeout' && "Time's up! ⏰"}
          {endReason === 'left' && 'Stranger left the chat'}
          {endReason === 'reported' && 'Chat ended & reported'}
        </h2>

        <p className="font-body text-xs text-ink-soft mb-8 leading-relaxed">
          {endReason === 'timeout' && '5 minutes are over! No contact info or messages were saved.'}
          {endReason === 'left' && 'Your chat partner left the session early. Ready for another?'}
          {endReason === 'reported' && 'Thank you for keeping the campus safe.'}
        </p>

        <div className="space-y-3">
          <Button onClick={startSearching} className="w-full" size="lg">
            Match again {mode === 'garba' ? '🪩' : mode === 'music' ? '🎧' : '💘'}
          </Button>
          <Link href="/" className="block">
            <Button variant="secondary" className="w-full">
              Back to Feed
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── 5. LANDING SCREEN ────────────────────────────────────────
  return (
    <div className="px-4 py-6 max-w-sm mx-auto">
      {/* 3-Mode Selector Tabs */}
      <div className="p-1 bg-ink/5 rounded-2xl flex gap-1 mb-6">
        <button
          onClick={() => setMode('general')}
          className={`flex-1 py-2 px-2 rounded-xl font-display text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            mode === 'general'
              ? 'bg-card text-ink shadow-xs'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          <span>🎭</span> Random
        </button>
        <button
          onClick={() => setMode('garba')}
          className={`flex-1 py-2 px-2 rounded-xl font-display text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
            mode === 'garba'
              ? 'bg-gradient-to-r from-coral to-amber-500 text-white shadow-xs'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          <span>🪩</span> Garba
        </button>
        <button
          onClick={() => setMode('music')}
          className={`flex-1 py-2 px-1.5 rounded-xl font-display text-[11px] font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
            mode === 'music'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
              : 'text-ink-soft hover:text-ink'
          }`}
        >
          <div className="flex items-center gap-1">
            <span>🎧</span> Music
          </div>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-300 font-mono">
            Working on it
          </span>
        </button>
      </div>

      {/* Cross-Matching Banner for Random & Garba */}
      {mode !== 'music' && (
        <div className="mb-5 p-3 rounded-2xl bg-gradient-to-r from-green-soft to-amber-50 dark:to-amber-950/20 border border-green/20 flex items-center gap-2.5 shadow-xs animate-fade-in">
          <span className="text-xl">⚡</span>
          <p className="font-body text-xs text-ink-soft leading-snug">
            <strong className="text-ink font-semibold">Cross-Matching Active:</strong> Random & Garba daters are now paired in a shared pool so you find matches in seconds!
          </p>
        </div>
      )}

      {/* Hero Icon & Title */}
      <div className="text-center mb-6">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-3xl flex items-center justify-center text-3xl shadow-sm border ${
          mode === 'garba'
            ? 'bg-amber-100 text-amber-700 border-amber-300'
            : mode === 'music'
            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 border-purple-300'
            : 'bg-coral-soft text-coral border-coral/20'
        }`}>
          {mode === 'garba' ? '🪩' : mode === 'music' ? '🎧' : '💘'}
        </div>
        <h1 className="font-display text-3xl font-bold text-ink mb-1.5">
          {mode === 'garba' ? 'Garba Partner Match' : mode === 'music' ? 'Music Match' : 'Blind Date'}
        </h1>
        <p className={`font-display text-xs font-bold uppercase tracking-wider mb-2 ${
          mode === 'garba' ? 'text-amber-700' : mode === 'music' ? 'text-purple-600' : 'text-coral'
        }`}>
          {mode === 'music' ? 'Still working on it' : '5-Minute Anonymous Live Chat'}
        </p>
        <p className="font-body text-xs text-ink-soft max-w-xs mx-auto">
          {mode === 'garba'
            ? 'Pair with another RGPV student looking for a Garba dance partner, passes, or squad.'
            : mode === 'music'
            ? 'We are still working on the ad-free, 0-lag synchronized co-listening experience.'
            : 'Random stranger. No profiles. No photos. Just conversation.'}
        </p>
      </div>

      {/* Music Vibe Selector (When Music Mode is Selected) */}
      {mode === 'music' && (
        <div className="mb-6 p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center animate-fade-in space-y-3">
          <div className="text-3xl">🚧</div>
          <h3 className="font-display text-sm font-bold text-purple-900 dark:text-purple-200">
            Music Match — Still working on it.
          </h3>
          <p className="font-body text-xs text-purple-700 dark:text-purple-300 max-w-xs mx-auto leading-relaxed">
            We are putting the final touches on ad-free, synchronized YouTube co-listening so it works reliably on all phones and networks.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={() => setMode('general')}
              className="px-4 py-2 rounded-xl bg-coral text-white font-display text-xs font-bold hover:bg-coral/90 transition-colors shadow-xs"
            >
              🎭 Jump into Random Match
            </button>
            <button
              type="button"
              onClick={() => setMode('garba')}
              className="px-4 py-2 rounded-xl bg-amber-500 text-white font-display text-xs font-bold hover:bg-amber-600 transition-colors shadow-xs"
            >
              🪩 Jump into Garba Match
            </button>
          </div>
        </div>
      )}

      {/* Rules / Explainer Card */}
      <div className="bg-card rounded-2xl border border-ink/5 p-4 mb-6 shadow-xs space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-base">⏱️</span>
          <div>
            <h4 className="font-display text-xs font-bold text-ink">5 Minutes strictly</h4>
            <p className="font-body text-[11px] text-ink-soft">
              The chat automatically self-destructs when the countdown hits 0:00.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-base">{mode === 'music' ? '🎶' : '🎭'}</span>
          <div>
            <h4 className="font-display text-xs font-bold text-ink">
              {mode === 'music' ? 'Shared Audio & Co-Listening' : '100% Anonymous'}
            </h4>
            <p className="font-body text-[11px] text-ink-soft">
              {mode === 'music'
                ? 'Drop any YouTube song link to play it synchronously in the chat room.'
                : 'You both chat using temporary campus handles. No history is kept.'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-base">🛡️</span>
          <div>
            <h4 className="font-display text-xs font-bold text-ink">Zero Tolerance</h4>
            <p className="font-body text-[11px] text-ink-soft">
              Never share phone numbers or socials. Inappropriate users get suspended.
            </p>
          </div>
        </div>
      </div>

      {mode !== 'music' && (
        <>
          {/* 18+ Checkbox */}
          <div className="mb-6 flex items-center gap-2.5 px-2">
            <input
              id="18plus"
              type="checkbox"
              checked={is18Plus}
              onChange={(e) => handleCheckboxChange(e.target.checked)}
              className="w-4 h-4 rounded text-coral accent-coral focus:ring-coral/30 cursor-pointer"
            />
            <label htmlFor="18plus" className="font-body text-xs text-ink cursor-pointer select-none">
              I confirm that I am <span className="font-semibold text-coral">18 years or older</span>
            </label>
          </div>

          {/* Action Button */}
          <Button
            onClick={startSearching}
            disabled={!is18Plus}
            className={`w-full shadow-lg ${
              mode === 'garba'
                ? 'bg-gradient-to-r from-coral to-amber-500 hover:from-coral/90 hover:to-amber-500/90 shadow-amber-500/20 text-white'
                : 'shadow-coral/20'
            }`}
            size="lg"
          >
            {mode === 'garba' ? 'Find Garba Partner 🪩' : 'Find a match 💘'}
          </Button>
        </>
      )}

      <p className="font-mono text-[9px] text-ink-soft/40 text-center mt-6">
        RGPV / UIT Bhopal students only · Automated bot matching
      </p>
    </div>
  );
}
