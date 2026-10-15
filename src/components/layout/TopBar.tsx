'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAnon } from '@/context/AnonContext';
import { useToast } from '@/context/ToastContext';
import { useMod } from '@/context/ModContext';

export default function TopBar() {
  const { profile, loading, authError, activeCount, rerollHandle, retryInit } = useAnon();
  const { showToast } = useToast();
  const { isMod, openModModal } = useMod();
  const [rerolling, setRerolling] = useState(false);

  const handleReroll = async () => {
    if (rerolling) return;
    setRerolling(true);
    const res = await rerollHandle();
    if (res.success) {
      showToast('New handle assigned! 🎲', 'success');
    } else {
      showToast(res.error || 'Cannot change handle yet (limit 1/hr)', 'info');
    }
    setRerolling(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-ink/5">
        <div className="max-w-md mx-auto px-3.5 h-14 flex items-center justify-between gap-1.5 overflow-hidden">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 group shrink min-w-0">
            <span className="text-xl shrink-0">📌</span>
            <span className="font-display font-bold text-ink text-sm sm:text-base tracking-tight truncate group-hover:text-green transition-colors">
              RGPV Gossip Point
            </span>
          </Link>

          {/* Right side: Mod Button + Live Active Count + Anonymous Handle */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Moderator Shield Button */}
            <button
              onClick={openModModal}
              className={`h-7 px-1.5 rounded-full text-xs transition-colors flex items-center gap-1 shrink-0 ${
                isMod
                  ? 'bg-amber-500/20 text-amber-900 border border-amber-500/40 font-semibold'
                  : 'hover:bg-ink/5 text-ink-soft/60 hover:text-ink'
              }`}
              title={isMod ? 'Moderator Mode Active (Click to manage)' : 'Campus Moderator Access'}
              aria-label="Moderator Access"
            >
              <span>🛡️</span>
              {isMod && <span className="text-[10px] font-mono font-bold">Mod</span>}
            </button>

            {/* Live Active Campus Badge */}
            <div
              className="h-7 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-mono shrink-0"
              title={`${activeCount} campus students active right now`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-bold">{activeCount}</span>
              <span className="hidden sm:inline text-[10px] text-emerald-700/80">live</span>
            </div>

            {/* Anonymous Handle + Reroll Button (Stable fixed-height pill, zero layout jump) */}
            <div className="h-7 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-soft border border-green/20 shrink-0">
              <span className="text-xs font-mono text-green font-medium max-w-[70px] xs:max-w-[85px] sm:max-w-[110px] truncate">
                {profile?.handle || (loading ? 'Loading...' : 'Anonymous')}
              </span>
              <button
                onClick={handleReroll}
                disabled={rerolling || loading}
                className="p-0.5 hover:bg-green/10 rounded-full text-xs text-ink-soft hover:text-green transition-colors disabled:opacity-50"
                title="Roll a new handle (once per hour)"
                aria-label="Roll new handle"
              >
                {rerolling ? '⏳' : '🎲'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Supabase Anonymous Auth Setup Notice */}
      {authError && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200">
          <div className="max-w-md mx-auto flex items-start gap-2">
            <span className="text-base flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold">Supabase Anonymous Sign-In Required</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {authError.toLowerCase().includes('disabled')
                  ? 'Enable Anonymous Sign-ins in Supabase: Authentication → Providers → Anonymous → Toggle ON.'
                  : `Supabase connection issue: ${authError}. Check your .env.local project credentials.`}
              </p>
            </div>
            <button
              onClick={() => retryInit()}
              className="px-2 py-1 bg-amber-500 text-white font-medium rounded text-[11px] hover:bg-amber-600 transition-colors flex-shrink-0"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </>
  );
}
