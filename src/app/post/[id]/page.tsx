'use client';

import { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getPostDetail } from '@/actions/posts';
import { getComments, createComment } from '@/actions/comments';
import NoteCard from '@/components/ui/NoteCard';
import Badge from '@/components/ui/Badge';
import ReactionBar from '@/components/features/ReactionBar';
import CommentThread from '@/components/features/CommentThread';
import ReportModal from '@/components/features/ReportModal';
import { useToast } from '@/context/ToastContext';
import { useAnon } from '@/context/AnonContext';
import { useMod } from '@/context/ModContext';
import { adminDeletePost } from '@/actions/admin';
import { HOT_THRESHOLD, POST_SECTIONS } from '@/types';
import type { PostView, CommentView } from '@/types';

const COMMENT_EMOJIS = ['🔥', '😂', '💀', '👀', '💯', '☕', '🤫', '❤️', '✨', '😭', '🚩'];

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const { profile } = useAnon();

  const [post, setPost] = useState<PostView | null>(null);
  const [comments, setComments] = useState<CommentView[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const { showToast } = useToast();
  const { isMod, modPasscode, setEditingPost } = useMod();

  useEffect(() => {
    async function load() {
      const [postResult, commentsResult] = await Promise.all([
        getPostDetail(postId),
        getComments(postId),
      ]);

      if (postResult.success && postResult.data) {
        setPost(postResult.data);
      }
      if (commentsResult.success && commentsResult.data) {
        setComments(commentsResult.data);
      }
      setLoading(false);
    }
    load();
  }, [postId]);

  const handleComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const commentBody = newComment.trim();
    if (!commentBody || isPending) return;

    // Optimistic immediate update
    const tempComment: CommentView = {
      id: `temp-${Date.now()}`,
      post_id: postId,
      parent_id: null,
      body: commentBody,
      created_at: new Date().toISOString(),
      handle: profile?.handle || 'You',
      replies: [],
    };

    setComments(prev => [...prev, tempComment]);
    setNewComment('');

    startTransition(async () => {
      const result = await createComment(postId, commentBody);
      if (result.success) {
        const commentsResult = await getComments(postId);
        if (commentsResult.success && commentsResult.data) {
          setComments(commentsResult.data);
        }
        showToast('Comment dropped 💬', 'success');
      } else {
        // Revert on failure
        setComments(prev => prev.filter(c => c.id !== tempComment.id));
        setNewComment(commentBody);
        showToast(result.error || 'Failed to comment', 'error');
      }
    });
  };

  const handleReply = async (parentId: string, body: string): Promise<boolean> => {
    const replyBody = body.trim();
    if (!replyBody) return false;

    // Optimistic immediate reply
    const tempReply: CommentView = {
      id: `temp-${Date.now()}`,
      post_id: postId,
      parent_id: parentId,
      body: replyBody,
      created_at: new Date().toISOString(),
      handle: profile?.handle || 'You',
    };

    setComments(prev => prev.map(c => {
      if (c.id === parentId) {
        return { ...c, replies: [...(c.replies || []), tempReply] };
      }
      return c;
    }));

    const result = await createComment(postId, replyBody, parentId);
    if (result.success) {
      const commentsResult = await getComments(postId);
      if (commentsResult.success && commentsResult.data) {
        setComments(commentsResult.data);
      }
      showToast('Reply posted ↩️', 'success');
      return true;
    } else {
      // Revert on failure
      setComments(prev => prev.map(c => {
        if (c.id === parentId) {
          return { ...c, replies: (c.replies || []).filter(r => r.id !== tempReply.id) };
        }
        return c;
      }));
      showToast(result.error || 'Failed to reply', 'error');
      return false;
    }
  };

  const addEmojiToComment = (emoji: string) => {
    setNewComment(prev => `${prev}${emoji}`);
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin text-3xl">📌</div>
        <p className="font-body text-xs text-ink-soft mt-3">Loading discussion...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="px-4 py-16 text-center">
        <div className="text-4xl mb-3">📭</div>
        <p className="font-display text-base font-semibold text-ink mb-2">Post not found</p>
        <p className="font-body text-xs text-ink-soft mb-5">This confession may have expired or been removed.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-green text-white rounded-xl text-xs font-mono font-medium shadow-sm hover:bg-green/90 transition-colors"
        >
          ← Back to campus feed
        </Link>
      </div>
    );
  }

  const totalReactions = Object.values(post.reaction_counts || {}).reduce(
    (sum, count) => sum + (count || 0),
    0
  );
  const isHot = totalReactions >= HOT_THRESHOLD;
  const sectionMeta = POST_SECTIONS.find(s => s.id === post.section);
  const totalCommentsCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);

  return (
    <div className="px-4 py-4 max-w-xl mx-auto">
      {/* Back button */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 font-mono text-xs text-ink-soft hover:text-green transition-colors"
        >
          ← Back to feed
        </button>
        <span className="font-mono text-[11px] text-ink-soft">
          UIT RGPV Bhopal
        </span>
      </div>

      {/* Main Post Card */}
      <NoteCard index={0} isHot={isHot}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-ink">{post.handle}</span>
            <Badge variant="community">{sectionMeta?.label || post.section}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {isHot && <Badge variant="hot">HOT 🔥</Badge>}
            {isMod && (
              <div className="flex items-center gap-1.5 mr-1">
                <button
                  type="button"
                  onClick={() => setEditingPost({ id: post.id, body: post.body })}
                  className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 text-xs font-mono font-semibold transition-colors"
                  title="Edit post text (Mod)"
                >
                  ✏️ Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!modPasscode || isDeletingPost) return;
                    if (!window.confirm('Delete this post as moderator?')) return;
                    setIsDeletingPost(true);
                    const res = await adminDeletePost(post.id, modPasscode);
                    if (res.success) {
                      showToast('Post removed by moderator 🗑️', 'success');
                      router.push('/');
                    } else {
                      showToast(res.error || 'Failed to remove post', 'error');
                      setIsDeletingPost(false);
                    }
                  }}
                  disabled={isDeletingPost}
                  className="px-2 py-1 rounded bg-red-500/15 hover:bg-red-500/25 text-red-700 text-xs font-mono font-semibold transition-colors disabled:opacity-50"
                  title="Remove post (Mod)"
                >
                  {isDeletingPost ? '...' : '🗑️ Remove'}
                </button>
              </div>
            )}
            <button
              onClick={() => setShowReport(true)}
              className="p-1.5 rounded-full hover:bg-coral-soft text-ink-soft/40 hover:text-coral transition-colors"
              title="Report post"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Full Post Body - No Truncation */}
        <p className="font-body text-base text-ink leading-relaxed mb-4 whitespace-pre-wrap select-text">
          {post.body}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-ink/5">
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

      {/* Comments & Discussion Section */}
      <div className="mt-5 bg-card rounded-2xl border border-ink/10 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-ink/5">
          <h2 className="font-display text-sm font-bold text-ink flex items-center gap-2">
            <span>💬 Discussion</span>
            <span className="px-2 py-0.5 rounded-full bg-ink/5 font-mono text-[11px] font-semibold text-ink-soft">
              {totalCommentsCount}
            </span>
          </h2>
          <span className="font-mono text-[10px] text-ink-soft">Anonymous replies</span>
        </div>

        {/* Comment Thread */}
        <CommentThread comments={comments} onReply={handleReply} />

        {/* New Comment Form & Emoji Bar */}
        <div id="comment-box" className="mt-5 pt-3 border-t border-ink/10">
          <label className="flex items-center justify-between font-mono text-[11px] font-medium text-ink-soft mb-1.5">
            <span>Drop an anonymous reply:</span>
            <span className="text-[10px] text-coral font-semibold">🛑 No real names / roll numbers</span>
          </label>

          {/* Quick Emoji Toolbar */}
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="font-mono text-[10px] text-ink-soft mr-0.5">Add:</span>
            {COMMENT_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmojiToComment(emoji)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-ink/5 hover:bg-ink/10 text-xs transition-transform active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>

          <form onSubmit={handleComment} className="space-y-2">
            <div className="relative">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleComment();
                  }
                }}
                placeholder="What do you think about this? Spill your thoughts..."
                maxLength={300}
                rows={2}
                className="
                  w-full px-3.5 py-2.5 rounded-xl
                  bg-paper border border-ink/15
                  font-body text-xs text-ink
                  placeholder:text-ink-soft/40
                  focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green
                  transition-all resize-none
                "
              />
              <span className="absolute bottom-2 right-3 font-mono text-[10px] text-ink-soft/60 pointer-events-none">
                {newComment.length}/300
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-ink-soft/60">
                Press Enter to post
              </span>
              <button
                type="submit"
                disabled={!newComment.trim() || isPending}
                className="
                  px-4 py-2 rounded-xl
                  bg-green text-white font-body text-xs font-semibold
                  hover:bg-green/90 transition-colors shadow-sm
                  disabled:opacity-30 disabled:cursor-not-allowed
                  flex items-center gap-1.5
                "
              >
                <span>{isPending ? 'Posting...' : 'Post Reply'}</span>
                <span>💬</span>
              </button>
            </div>
          </form>
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
