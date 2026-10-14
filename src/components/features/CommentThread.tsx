'use client';

import { useState } from 'react';
import ReportModal from '@/components/features/ReportModal';
import type { CommentView } from '@/types';

interface CommentThreadProps {
  comments: CommentView[];
  onReply?: (parentId: string, body: string) => Promise<boolean>;
}

export default function CommentThread({ comments, onReply }: CommentThreadProps) {
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});

  const toggleLike = (commentId: string) => {
    setLikedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleSendReply = async (parentId: string) => {
    if (!replyText.trim() || !onReply || isSubmittingReply) return;
    setIsSubmittingReply(true);
    const success = await onReply(parentId, replyText.trim());
    if (success) {
      setReplyText('');
      setReplyingToId(null);
    }
    setIsSubmittingReply(false);
  };

  if (comments.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="font-body text-xs text-ink-soft">
          No comments yet. Spill your thoughts first 💬
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 divide-y divide-ink/5">
      {comments.map((comment) => (
        <div key={comment.id} className="pt-3 first:pt-0">
          {/* Top-Level Comment */}
          <div className="group">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[11px] font-semibold text-ink">
                {comment.handle}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-ink-soft/60">
                  {getTimeAgo(comment.created_at)}
                </span>
                <button
                  onClick={() => setReportTarget(comment.id)}
                  className="p-1 rounded-full hover:bg-coral-soft text-ink-soft/40 hover:text-coral transition-colors"
                  title="Report comment"
                  aria-label="Report comment"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <p className="font-body text-sm text-ink leading-relaxed whitespace-pre-wrap">
              {comment.body}
            </p>

            {/* Action Bar (Reply + Upvote) */}
            <div className="flex items-center gap-3 mt-1.5">
              <button
                onClick={() => {
                  setReplyingToId(replyingToId === comment.id ? null : comment.id);
                  setReplyText('');
                }}
                className="font-mono text-[10px] font-medium text-ink-soft hover:text-green flex items-center gap-1 transition-colors"
              >
                ↩️ {replyingToId === comment.id ? 'Cancel' : 'Reply'}
              </button>

              <button
                onClick={() => toggleLike(comment.id)}
                className={`
                  font-mono text-[10px] flex items-center gap-1 transition-colors
                  ${likedComments[comment.id] ? 'text-coral font-bold' : 'text-ink-soft hover:text-coral'}
                `}
              >
                {likedComments[comment.id] ? '❤️' : '🤍'}
                <span>{likedComments[comment.id] ? 1 : ''}</span>
              </button>
            </div>

            {/* Inline Reply Input Form */}
            {replyingToId === comment.id && (
              <div className="mt-2.5 ml-3 p-2.5 rounded-xl bg-ink/5 border border-ink/5 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-[10px] font-mono text-ink-soft">
                  <span>Replying to <strong className="text-ink">@{comment.handle}</strong></span>
                  <button
                    onClick={() => setReplyingToId(null)}
                    className="hover:text-ink"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply(comment.id)}
                    placeholder="Write a reply..."
                    maxLength={300}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-card border border-ink/10 text-xs text-ink placeholder:text-ink-soft/40 focus:outline-none focus:ring-1 focus:ring-green"
                  />
                  <button
                    onClick={() => handleSendReply(comment.id)}
                    disabled={!replyText.trim() || isSubmittingReply}
                    className="px-3 py-1.5 rounded-lg bg-green text-white text-xs font-semibold hover:bg-green/90 transition-colors disabled:opacity-40"
                  >
                    {isSubmittingReply ? '...' : 'Reply'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 1-Level Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2.5 ml-3 pl-3 border-l-2 border-amber-300/60 dark:border-amber-500/40 space-y-2.5">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="pt-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-[10px] font-semibold text-ink-soft">
                      {reply.handle}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[9px] text-ink-soft/60">
                        {getTimeAgo(reply.created_at)}
                      </span>
                      <button
                        onClick={() => setReportTarget(reply.id)}
                        className="p-0.5 rounded text-ink-soft/30 hover:text-coral transition-colors"
                        title="Report reply"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="font-body text-xs text-ink leading-relaxed whitespace-pre-wrap">
                    {reply.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Report modal */}
      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType="comment"
          targetId={reportTarget}
        />
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
