'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAnon } from '@/context/AnonContext';

export default function CampusNoticeBanner() {
  const { activeCount } = useAnon();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isLive: boolean;
    isPast: boolean;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isLive: false,
    isPast: false,
  });

  useEffect(() => {
    setMounted(true);
    const saved = sessionStorage.getItem('rgpv_notice_collapsed');
    if (saved === '1') {
      setCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('rgpv_notice_collapsed', nextState ? '1' : '0');
    }
  };

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(13, 0, 0, 0); // 1:00 PM local time

      const currentHour = now.getHours();

      // Between 1:00 PM (13:00) and 2:00 PM (14:00) is the active lunch hour rush
      if (currentHour === 13) {
        setTimeLeft({
          hours: 0,
          minutes: 59 - now.getMinutes(),
          seconds: 59 - now.getSeconds(),
          isLive: true,
          isPast: false,
        });
        return;
      }

      // Past 2:00 PM
      if (currentHour >= 14) {
        target.setDate(target.getDate() + 1);
        const diff = Math.max(0, target.getTime() - now.getTime());
        setTimeLeft({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
          isLive: false,
          isPast: true,
        });
        return;
      }

      // Before 1:00 PM
      const diff = Math.max(0, target.getTime() - now.getTime());
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isLive: false,
        isPast: false,
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatPad = (n: number) => n.toString().padStart(2, '0');

  if (!mounted) return null;

  // Minimized state view
  if (collapsed) {
    return (
      <aside aria-label="Campus Notice Summary" className="mb-3">
        <button
          onClick={toggleCollapsed}
          className="w-full text-left p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2 text-xs hover:bg-amber-500/15 transition-all shadow-sm group"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-base flex-shrink-0">📌</span>
            <span className="font-semibold text-amber-950 font-display truncate">
              Campus Notice: 1:00 PM Rush ({timeLeft.isLive ? 'LIVE 🔥' : `${formatPad(timeLeft.hours)}h ${formatPad(timeLeft.minutes)}m`})
            </span>
            <span className="hidden xs:inline-block px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 text-[10px] font-mono font-semibold flex-shrink-0">
              🟢 {activeCount} live
            </span>
          </div>
          <span className="font-mono text-[11px] text-amber-800/80 group-hover:text-amber-950 font-semibold flex-shrink-0 flex items-center gap-1">
            Read notice ▼
          </span>
        </button>
      </aside>
    );
  }

  // Full Expanded Campus Bulletin
  return (
    <aside aria-label="Campus Notice" className="mb-4 relative rounded-2xl bg-gradient-to-br from-[#FFF9EE] to-[#FFF4D9] border-2 border-amber-300/80 p-3.5 sm:p-4 shadow-sm text-ink overflow-hidden animate-fade-in">
      {/* Decorative Thumbtack Pin */}
      <div className="absolute top-2 right-3 flex items-center gap-2">
        <button
          onClick={toggleCollapsed}
          className="px-2 py-0.5 text-[11px] font-mono font-semibold text-amber-900/70 hover:text-amber-950 hover:bg-amber-400/20 rounded-md transition-colors"
          title="Minimize notice"
        >
          Minimize ▲
        </button>
        <span className="text-xl select-none" aria-hidden="true">📌</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5 pr-24">
        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-950 text-[10px] font-mono font-bold tracking-wider uppercase">
          Official Notice
        </span>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-900 text-[11px] font-mono font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span>{activeCount} students online</span>
        </div>
      </div>

      <h2 className="font-display font-bold text-base text-amber-950 mb-3 tracking-tight">
        Campus Code of Conduct & 1:00 PM Rush 📢
      </h2>

      {/* Rules & Information */}
      <div className="space-y-2.5 text-xs text-amber-950/90 leading-relaxed font-body mb-3.5">
        {/* 1. Zero Targeting / No Real Names */}
        <div className="flex items-start gap-2 bg-white/60 rounded-xl p-2.5 border border-amber-200/80">
          <span className="text-base flex-shrink-0">🛑</span>
          <div>
            <p className="font-bold text-amber-950">Strict Rule: No Names or Targeting</p>
            <p className="text-[11px] text-amber-900/80 mt-0.5">
              Do <strong>NOT</strong> post or comment anyone&apos;s real name, roll number, or personal identity. Offensive or defaming posts are removed immediately. Keep confessions respectful and fun.
            </p>
          </div>
        </div>

        {/* 2. 1:00 PM Lunchtime Garba Match Rush */}
        <div className="bg-gradient-to-r from-coral-soft/80 to-amber-100/80 rounded-xl p-2.5 border border-coral/30">
          <div className="flex items-start gap-2">
            <span className="text-base flex-shrink-0">💃</span>
            <div className="flex-1">
              <p className="font-bold text-ink">
                1:00 PM Lunchtime Garba & Blind Date Rush!
              </p>
              <p className="text-[11px] text-ink-soft mt-0.5">
                At <strong>1:00 PM lunch break</strong>, everyone hops on to match for a <strong>Garba Partner</strong> or anonymous blind chat!
              </p>

              {/* Live Countdown Display */}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-ink/5">
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-sm">⏰</span>
                  {timeLeft.isLive ? (
                    <span className="font-bold text-coral animate-pulse flex items-center gap-1">
                      🔥 LUNCH RUSH IS LIVE NOW ({formatPad(timeLeft.minutes)}m left)
                    </span>
                  ) : timeLeft.isPast ? (
                    <span className="font-semibold text-ink-soft">
                      Next rush tomorrow at 1:00 PM
                    </span>
                  ) : (
                    <span className="font-bold text-ink font-mono tracking-wider">
                      {formatPad(timeLeft.hours)}h {formatPad(timeLeft.minutes)}m {formatPad(timeLeft.seconds)}s remaining
                    </span>
                  )}
                </div>

                <Link
                  href="/blind-date?mode=garba"
                  className="px-3 py-1 rounded-lg bg-coral text-white font-display font-semibold text-xs hover:bg-coral/90 transition-all shadow-sm inline-flex items-center gap-1"
                >
                  <span>Find Garba Partner</span>
                  <span>💃</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Campus Exclusivity */}
        <div className="flex items-start gap-2 bg-white/60 rounded-xl p-2.5 border border-amber-200/80">
          <span className="text-base flex-shrink-0">🏫</span>
          <div>
            <p className="font-bold text-amber-950">UIT, SOIT & RGPV Campus Students Only</p>
            <p className="text-[11px] text-amber-900/80 mt-0.5">
              This platform is strictly built for students of UIT RGPV, SOIT, and University Campus. If you are not from our campus, please do not enter — this space is not for you.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
