'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAnon } from '@/context/AnonContext';
import { useToast } from '@/context/ToastContext';

export default function TopBar() {
  const { profile, loading, authError, rerollHandle, retryInit } = useAnon();
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
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl">📌</span>
            <span className="font-display font-bold text-ink text-base tracking-tight group-hover:text-green transition-colors">
              RGPV Gossip Point
            </span>
          </Link>

          {/* Anonymous Handle + Reroll Button */}
          <div className="flex items-center gap-1.5">
            {loading ? (
              <div className="h-7 w-28 bg-ink/5 rounded-full animate-pulse" />
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-soft border border-green/20">
                <span className="text-xs font-mono text-green font-medium max-w-[130px] truncate">
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
