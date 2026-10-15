'use client';

import { useState } from 'react';
import Link from 'next/link';
import NoteCard from '@/components/ui/NoteCard';
import Badge from '@/components/ui/Badge';
import ReactionBar from '@/components/features/ReactionBar';
import { createComment } from '@/actions/comments';
import { adminDeletePost } from '@/actions/admin';
import { useToast } from '@/context/ToastContext';
import { useMod } from '@/context/ModContext';
import { HOT_THRESHOLD, POST_SECTIONS } from '@/types';
import type { PostView } from '@/types';

interface PostCardProps {
  post: PostView;
  index?: number;
}

const QUICK_EMOJIS = ['🔥', '😂', '💀', '👀', '💯', '☕', '❤️'];

export default function PostCard({ post, index = 0 }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuickReply, setShowQuickReply] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();
  const { isMod, modPasscode, setEditingPost } = useMod();

  const totalReactions = Object.values(post.reaction_counts || {}).reduce(
    (sum, count) => sum + (count || 0),
    0
  );
  const isHot = totalReactions >= HOT_THRESHOLD;
  const timeAgo = getTimeAgo(post.created_at);
  const sectionMeta = POST_SECTIONS.find(s => s.id === post.section);

  const isLong = post.body.length > 170 || post.body.split('\n').length > 3;

  const handleQuickComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const result = await createComment(post.id, commentText.trim());
    if (result.success) {
      setCommentCount(prev => prev + 1);
      setCommentText('');
      showToast('Comment dropped 💬', 'success');
      setShowQuickReply(false);
    } else {
      showToast(result.error || 'Failed to comment', 'error');
    }
    setIsSubmitting(false);
  };

  const addEmoji = (emoji: string) => {
    setCommentText(prev => `${prev}${emoji}`);
  };

  if (isRemoved) {
    return null;
  }

  return (
    <NoteCard index={index} isHot={isHot}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <Link
          href={`/post/${post.id}`}
          className="flex items-center gap-2 group/header"
        >
          <span className="font-mono text-xs text-ink-soft group-hover/header:text-green transition-colors font-medium">
            {post.handle}
          </span>
          <Badge variant="community">
            {sectionMeta?.label || post.section}
          </Badge>
        </Link>
        <div className="flex items-center gap-1.5">
          {isHot && <Badge variant="hot">HOT 🔥</Badge>}
          {isMod && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditingPost({ id: post.id, body: post.body });
                }}
                className="px-1.5 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 text-[10px] font-mono font-semibold transition-colors"
                title="Edit post text (Mod)"
              >
                ✏️ Edit
              </button>
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!modPasscode || isDeleting) return;
                  if (!window.confirm('Delete this post as moderator?')) return;
                  setIsDeleting(true);
                  const res = await adminDeletePost(post.id, modPasscode);
                  if (res.success) {
                    setIsRemoved(true);
                    showToast('Post removed by moderator 🗑️', 'success');
                  } else {
                    showToast(res.error || 'Failed to remove', 'error');
                  }
                  setIsDeleting(false);
                }}
                disabled={isDeleting}
                className="px-1.5 py-0.5 rounded bg-red-500/15 hover:bg-red-500/25 text-red-700 text-[10px] font-mono font-semibold transition-colors disabled:opacity-50"
                title="Remove post (Mod)"
              >
                {isDeleting ? '...' : '🗑️ Remove'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Body (with seamless inline expansion) */}
      <div className="mb-2.5">
        <p
          className={`font-body text-sm text-ink leading-relaxed whitespace-pre-wrap transition-all ${
            !isExpanded && isLong ? 'line-clamp-4' : ''
          }`}
        >
          {post.body}
        </p>

        {isLong && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mt-1.5 font-mono text-xs font-semibold text-green hover:underline inline-flex items-center gap-1"
          >
            {isExpanded ? '▴ Collapse post' : '▾ Read full confession...'}
          </button>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-ink/5">
        <ReactionBar
          targetId={post.id}
          counts={post.reaction_counts}
          userReaction={post.user_reaction}
          compact
        />

        <div className="flex items-center gap-2.5">
          {/* Quick Comment Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowQuickReply(!showQuickReply);
            }}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all
              ${showQuickReply
                ? 'bg-green text-white font-semibold'
                : 'bg-ink/5 text-ink-soft hover:text-green hover:bg-green/10'
              }
            `}
          >
            <span>💬</span>
            <span className="text-[11px] font-semibold">{commentCount}</span>
            <span className="hidden sm:inline text-[10px]">Comment</span>
          </button>

          <Link
            href={`/post/${post.id}`}
            className="font-mono text-[10px] text-ink-soft/70 hover:text-ink transition-colors"
          >
            {timeAgo}
          </Link>
        </div>
      </div>

      {/* Inline Quick Comment Drawer */}
      {showQuickReply && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-3 pt-3 border-t border-ink/10 animate-fade-in"
        >
          {/* Quick Emoji Bar */}
          <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="font-mono text-[10px] text-ink-soft mr-1">Quick:</span>
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-ink/5 hover:bg-ink/10 text-xs transition-transform active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>

          <form onSubmit={handleQuickComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Drop an anonymous reply..."
              maxLength={300}
              className="
                flex-1 px-3 py-2 rounded-xl
                bg-paper border border-ink/10
                font-body text-xs text-ink
                placeholder:text-ink-soft/40
                focus:outline-none focus:ring-1 focus:ring-green
              "
              autoFocus
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmitting}
              className="
                px-3.5 py-2 rounded-xl
                bg-green text-white font-body text-xs font-semibold
                hover:bg-green/90 transition-colors
                disabled:opacity-30 disabled:cursor-not-allowed
              "
            >
              {isSubmitting ? '...' : 'Send'}
            </button>
          </form>

          <div className="flex items-center justify-between mt-2 pt-1">
            <span className="font-mono text-[9px] text-ink-soft">
              {commentText.length}/300
            </span>
            <Link
              href={`/post/${post.id}`}
              className="font-mono text-[10px] text-green hover:underline flex items-center gap-1"
            >
              Open full discussion & replies →
            </Link>
          </div>
        </div>
      )}
    </NoteCard>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
