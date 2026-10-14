'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const isFeed = pathname === '/' || pathname.startsWith('/post/');
  const isBlindDate = pathname.startsWith('/blind-date');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-md border-t border-ink/5 safe-area-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-4">
        {/* Feed tab */}
        <Link
          href="/"
          className="flex flex-col items-center gap-0.5 px-3 py-1 transition-colors duration-200 min-w-[64px]"
        >
          <svg
            className={`w-6 h-6 ${isFeed ? 'text-green' : 'text-ink-soft'}`}
            fill={isFeed ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isFeed ? 0 : 1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
          <span className={`text-[10px] font-mono ${isFeed ? 'text-green font-bold' : 'text-ink-soft'}`}>
            Feed
          </span>
        </Link>

        {/* Floating compose button */}
        <Link
          href="/compose"
          className="w-12 h-12 -mt-5 rounded-2xl bg-green text-white shadow-lg shadow-green/30 flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all"
          aria-label="Compose post"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </Link>

        {/* Blind Date tab */}
        <Link
          href="/blind-date"
          className="flex flex-col items-center gap-0.5 px-3 py-1 transition-colors duration-200 min-w-[64px]"
        >
          <svg
            className={`w-6 h-6 ${isBlindDate ? 'text-coral' : 'text-ink-soft'}`}
            fill={isBlindDate ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isBlindDate ? 0 : 1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span className={`text-[10px] font-mono ${isBlindDate ? 'text-coral font-bold' : 'text-ink-soft'}`}>
            Blind Date
          </span>
        </Link>
      </div>
    </nav>
  );
}
