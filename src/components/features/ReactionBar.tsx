'use client';

import { useTransition } from 'react';
import { toggleReaction } from '@/actions/reactions';
import { REACTION_EMOJIS } from '@/types';
import type { ReactionEmoji } from '@/types';
import { useToast } from '@/context/ToastContext';

interface ReactionBarProps {
  targetId: string;
  counts?: Record<string, number>;
  userReaction?: string | null;
  compact?: boolean;
}

export default function ReactionBar({
  targetId,
  counts = {},
  userReaction,
  compact = false,
}: ReactionBarProps) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleReact = (emoji: ReactionEmoji) => {
    startTransition(async () => {
      const result = await toggleReaction(targetId, emoji);
      if (!result.success) {
        showToast(result.error || 'Failed to react', 'error');
      }
    });
  };

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
      {REACTION_EMOJIS.map(emoji => {
        const count = counts[emoji] || 0;
        const isActive = userReaction === emoji;

        return (
          <button
            key={emoji}
            onClick={(e) => {
              e.stopPropagation();
              handleReact(emoji);
            }}
            disabled={isPending}
            className={`
              flex items-center gap-1 rounded-full
              transition-all duration-200
              ${compact ? 'px-2 py-0.5' : 'px-2.5 py-1'}
              ${isActive
                ? 'bg-green-soft ring-1 ring-green/30 scale-105'
                : 'bg-ink/5 hover:bg-ink/10'
              }
              ${isPending ? 'opacity-50' : ''}
            `}
          >
            <span className={compact ? 'text-xs' : 'text-sm'}>{emoji}</span>
            {count > 0 && (
              <span className={`font-mono font-bold ${compact ? 'text-[9px]' : 'text-[10px]'} ${isActive ? 'text-green' : 'text-ink-soft'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
