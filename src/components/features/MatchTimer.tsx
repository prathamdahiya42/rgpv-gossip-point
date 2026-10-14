'use client';

import { useState, useEffect } from 'react';

interface MatchTimerProps {
  endsAt: string;
  serverTime?: string;
  onExpire: () => void;
}

export default function MatchTimer({ endsAt, serverTime, onExpire }: MatchTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const endsMs = new Date(endsAt).getTime();
    const serverMs = serverTime ? new Date(serverTime).getTime() : Date.now();
    const offset = Date.now() - serverMs;
    const nowMs = Date.now() - offset;
    return Math.max(0, Math.floor((endsMs - nowMs) / 1000));
  });

  useEffect(() => {
    const endsMs = new Date(endsAt).getTime();
    const serverMs = serverTime ? new Date(serverTime).getTime() : Date.now();
    const clockOffset = Date.now() - serverMs;

    const interval = setInterval(() => {
      const currentServerEstimated = Date.now() - clockOffset;
      const diffMs = endsMs - currentServerEstimated;
      const secondsLeft = Math.max(0, Math.floor(diffMs / 1000));

      setRemainingSeconds(secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt, serverTime, onExpire]);

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
  const isUrgent = remainingSeconds <= 30 && remainingSeconds > 0;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-bold text-xs
        transition-colors shadow-sm
        ${isUrgent
          ? 'bg-coral-soft text-coral animate-pulse border border-coral/30'
          : 'bg-ink/5 text-ink border border-ink/10'
        }
      `}
      title="Live chat timer (5:00 limit)"
      aria-live="polite"
    >
      <span>⏱️</span>
      <span>{formatted}</span>
    </div>
  );
}
