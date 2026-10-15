'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAnon } from '@/context/AnonContext';
import { useToast } from '@/context/ToastContext';

export default function TopBar() {
  const { profile, loading, authError, activeCount, rerollHandle, retryInit } = useAnon();
  const { showToast } = useToast();
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
      <header className="sticky top-0 z-40 bg-paper/85 backdrop-blur-md border-b border-ink/5">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 group">
            <span className="text-xl">📌</span>
            <span className="font-display font-bold text-ink text-sm sm:text-base tracking-tight group-hover:text-green transition-colors">
              RGPV Gossip Point
            </span>
          </Link>

          {/* Right side: Live Active Count + Anonymous Handle */}
          <div className="flex items-center gap-1.5">
            {/* Live Active Campus Badge */}
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-mono"
              title={`${activeCount} campus students active right now`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold">{activeCount}</span>
              <span className="hidden xs:inline text-[10px] text-emerald-700/80">live</span>
            </div>

            {loading ? (
              <div className="h-7 w-24 bg-ink/5 rounded-full animate-pulse" />
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-soft border border-green/20">
                <span className="text-xs font-mono text-green font-medium max-w-[110px] truncate">
                  {profile?.handle || 'Anonymous'}
                </span>
                <button
                  onClick={handleReroll}
                  disabled={rerolling}
                  className="p-1 hover:bg-green/10 rounded-full text-xs text-ink-soft hover:text-green transition-colors disabled:opacity-50"
                  title="Roll a new handle (once per hour)"
                  aria-label="Roll new handle"
                >
                  {rerolling ? '⏳' : '🎲'}
                </button>
              </div>
            )}
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
