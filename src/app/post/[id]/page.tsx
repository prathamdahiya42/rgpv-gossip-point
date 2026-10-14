'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPostDetail } from '@/actions/posts';
import { getComments, createComment } from '@/actions/comments';
import NoteCard from '@/components/ui/NoteCard';
import Badge from '@/components/ui/Badge';
import ReactionBar from '@/components/features/ReactionBar';
import CommentThread from '@/components/features/CommentThread';
import ReportModal from '@/components/features/ReportModal';
import { useToast } from '@/context/ToastContext';
import { HOT_THRESHOLD, POST_SECTIONS } from '@/types';
import type { PostView, CommentView } from '@/types';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<PostView | null>(null);
  const [comments, setComments] = useState<CommentView[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      const [postResult, commentsResult] = await Promise.all([
        getPostDetail(postId),
        getComments(postId),
      ]);

      if (postResult.success && postResult.data) setPost(postResult.data);
      if (commentsResult.success && commentsResult.data) setComments(commentsResult.data);
      setLoading(false);
    }
    load();
  }, [postId]);

  const handleComment = () => {
    if (!newComment.trim()) return;

    startTransition(async () => {
      const result = await createComment(postId, newComment);
      if (result.success) {
        setNewComment('');
        const commentsResult = await getComments(postId);
        if (commentsResult.success && commentsResult.data) {
          setComments(commentsResult.data);
        }
        showToast('Comment dropped 💬', 'success');
      } else {
        showToast(result.error || 'Failed to comment', 'error');
      }
    });
  };

  const handleReply = async (parentId: string, body: string): Promise<boolean> => {
    const result = await createComment(postId, body, parentId);
    if (result.success) {
      const commentsResult = await getComments(postId);
      if (commentsResult.success && commentsResult.data) {
        setComments(commentsResult.data);
      }
      showToast('Reply posted ↩️', 'success');
      return true;
    } else {
      showToast(result.error || 'Failed to reply', 'error');
      return false;
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin text-3xl">📌</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="font-display text-base text-ink mb-4">Post not found or has been removed.</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-green text-white rounded-xl text-xs font-mono"
        >
          ← Back to feed
        </button>
      </div>
    );
  }

  const totalReactions = Object.values(post.reaction_counts || {}).reduce(
    (sum, count) => sum + (count || 0),
    0
  );
  const isHot = totalReactions >= HOT_THRESHOLD;
  const sectionMeta = POST_SECTIONS.find(s => s.id === post.section);

  return (
    <div className="px-4 py-4">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-3 flex items-center gap-1 font-mono text-xs text-ink-soft hover:text-green transition-colors"
      >
        ← Back
      </button>

      {/* Post */}
      <NoteCard index={0} isHot={isHot}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-ink-soft">{post.handle}</span>
            <Badge variant="community">{sectionMeta?.label || post.section}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {isHot && <Badge variant="hot">HOT</Badge>}
            <button
              onClick={() => setShowReport(true)}
              className="p-1.5 rounded-full hover:bg-coral-soft transition-colors"
              title="Report post"
            >
              <svg className="w-4 h-4 text-ink-soft hover:text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
              </svg>
            </button>
          </div>
        </div>

        <p className="font-body text-base text-ink leading-relaxed mb-4 whitespace-pre-wrap">
          {post.body}
        </p>

        <div className="flex items-center justify-between pt-1">
          <ReactionBar
            targetId={post.id}
            counts={post.reaction_counts}
            userReaction={post.user_reaction}
          />
          <span className="font-mono text-[10px] text-ink-soft/70">
            {new Date(post.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </NoteCard>

      {/* Comments section */}
      <div className="mt-6 bg-card rounded-2xl border border-ink/5 p-4">
        <h2 className="font-display text-sm font-bold text-ink mb-2">
          Comments ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
        </h2>

        <CommentThread comments={comments} onReply={handleReply} />

        {/* Comment input */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleComment()}
            placeholder="Drop an anonymous reply (no contact info)..."
            maxLength={300}
            className="
              flex-1 px-4 py-2.5 rounded-xl
              bg-ink/5 border border-ink/10
              font-body text-xs text-ink
              focus:outline-none focus:ring-2 focus:ring-green/30
              placeholder:text-ink-soft/40
              transition-all
            "
          />
          <button
            onClick={handleComment}
            disabled={!newComment.trim() || isPending}
            className="
              px-4 py-2.5 rounded-xl
              bg-green text-white font-body text-xs font-semibold
              hover:bg-green/90 transition-colors
              disabled:opacity-30 disabled:cursor-not-allowed
            "
          >
            {isPending ? '...' : 'Reply'}
          </button>
        </div>
      </div>

      {/* Report modal */}
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        targetType="post"
        targetId={post.id}
      />
    </div>
  );
}
