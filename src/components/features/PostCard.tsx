'use client';

import { useRouter } from 'next/navigation';
import NoteCard from '@/components/ui/NoteCard';
import Badge from '@/components/ui/Badge';
import ReactionBar from '@/components/features/ReactionBar';
import { HOT_THRESHOLD, POST_SECTIONS } from '@/types';
import type { PostView } from '@/types';

interface PostCardProps {
  post: PostView;
  index?: number;
}

export default function PostCard({ post, index = 0 }: PostCardProps) {
  const router = useRouter();

  const totalReactions = Object.values(post.reaction_counts || {}).reduce(
    (sum, count) => sum + (count || 0),
    0
  );
  const isHot = totalReactions >= HOT_THRESHOLD;
  const timeAgo = getTimeAgo(post.created_at);

  const sectionMeta = POST_SECTIONS.find(s => s.id === post.section);

  return (
    <NoteCard
      index={index}
      isHot={isHot}
      onClick={() => router.push(`/post/${post.id}`)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-soft">{post.handle}</span>
          <Badge variant="community">
            {sectionMeta?.label || post.section}
          </Badge>
        </div>
        {isHot && <Badge variant="hot">HOT</Badge>}
      </div>

      {/* Post Body */}
      <p className="font-body text-sm text-ink leading-relaxed line-clamp-5 mb-3 whitespace-pre-wrap">
        {post.body}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <ReactionBar
          targetId={post.id}
          counts={post.reaction_counts}
          userReaction={post.user_reaction}
          compact
        />

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/post/${post.id}`);
            }}
            className="flex items-center gap-1 text-ink-soft hover:text-green transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-mono text-[10px]">{post.comment_count}</span>
          </button>

          <span className="font-mono text-[10px] text-ink-soft/70">{timeAgo}</span>
        </div>
      </div>
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
