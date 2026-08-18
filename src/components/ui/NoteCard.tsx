'use client';

import { type ReactNode } from 'react';

interface NoteCardProps {
  children: ReactNode;
  index?: number;
  isHot?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function NoteCard({ children, index = 0, isHot = false, onClick, className = '' }: NoteCardProps) {
  // Alternating slight rotation for corkboard feel
  const rotation = index % 2 === 0 ? '-1deg' : '1deg';
  const tapeColor = isHot ? 'bg-coral' : 'bg-green';

  return (
    <div
      className={`
        relative bg-card rounded-sm shadow-card
        transition-all duration-300 ease-out
        hover:shadow-card-hover hover:-translate-y-1 hover:z-10
        cursor-pointer group
        ${className}
      `}
      style={{ transform: `rotate(${rotation})` }}
      onClick={onClick}
    >
      {/* Tape corner */}
      <div
        className={`
          absolute -top-2 left-4 w-8 h-5
          ${tapeColor} opacity-80
          rounded-sm shadow-sm
          transform -rotate-6
          z-10
        `}
        style={{
          clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)',
        }}
      />

      {/* Card content */}
      <div className="p-4 pt-5">
        {children}
      </div>

      {/* Torn paper bottom edge */}
      <div
        className="absolute bottom-0 left-0 right-0 h-3 bg-card"
        style={{
          clipPath: `polygon(
            0% 0%, 3% 60%, 6% 20%, 9% 70%, 12% 30%, 15% 80%,
            18% 10%, 21% 60%, 24% 40%, 27% 90%, 30% 20%, 33% 70%,
            36% 35%, 39% 85%, 42% 15%, 45% 65%, 48% 25%, 51% 75%,
            54% 40%, 57% 90%, 60% 10%, 63% 55%, 66% 30%, 69% 80%,
            72% 20%, 75% 70%, 78% 45%, 81% 95%, 84% 15%, 87% 60%,
            90% 35%, 93% 85%, 96% 25%, 100% 50%, 100% 100%, 0% 100%
          )`,
        }}
      />

      {/* Hot glow effect */}
      {isHot && (
        <div className="absolute inset-0 rounded-sm ring-2 ring-coral/20 pointer-events-none" />
      )}
    </div>
  );
}
