'use client';

import { useState } from 'react';
import ReportModal from '@/components/features/ReportModal';
import type { CommentView } from '@/types';

interface CommentThreadProps {
  comments: CommentView[];
}

export default function CommentThread({ comments }: CommentThreadProps) {
  const [reportTarget, setReportTarget] = useState<string | null>(null);

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
    <div className="space-y-1 divide-y divide-ink/5">
      {comments.map((comment) => (
        <div key={comment.id} className="py-3">
          {/* Comment header */}
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[11px] font-medium text-ink-soft">
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

          {/* Comment body */}
          <p className="font-body text-sm text-ink leading-relaxed whitespace-pre-wrap">
            {comment.body}
          </p>
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
