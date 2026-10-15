'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getFeedPosts } from '@/actions/posts';
import PostCard from '@/components/features/PostCard';
import FilterChips from '@/components/ui/FilterChips';
import { POST_SECTIONS } from '@/types';
import type { FeedSection, PostSection, PostView } from '@/types';

import { seedSingleCampusStory, seedCampusStoriesIfEmpty } from '@/actions/seed';
import CampusNoticeBanner from '@/components/features/CampusNoticeBanner';

function FeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sParam = searchParams.get('s');
  const validSection: FeedSection =
    sParam && ['all', 'crushes', 'gossip', 'campus', 'garba'].includes(sParam)
      ? (sParam as FeedSection)
      : 'all';

  const [section, setSection] = useState<FeedSection>(validSection);
  const [sortBy, setSortBy] = useState<'new' | 'hot'>('new');
  const [posts, setPosts] = useState<PostView[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Sync section only when URL param changes externally (e.g. back/forward button)
  useEffect(() => {
    setSection(validSection);
  }, [validSection]);

  const loadFeed = useCallback(async (sec: FeedSection, sort: 'new' | 'hot') => {
    setLoading(true);
    const res = await getFeedPosts(sec, sort);
    if (res.success && res.data) {
      if (res.data.posts.length === 0 && sec !== 'all') {
        // Auto-seed initial authentic stories so students don't encounter a ghost town
        await seedCampusStoriesIfEmpty();
        const retry = await getFeedPosts(sec, sort);
        if (retry.success && retry.data && retry.data.posts.length > 0) {
          setPosts(retry.data.posts);
          setNextCursor(retry.data.nextCursor);
          setLoading(false);
          return;
        }
      }
      setPosts(res.data.posts);
      setNextCursor(res.data.nextCursor);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFeed(section, sortBy);
  }, [section, sortBy, loadFeed]);

  const handleSelectSection = (val: string) => {
    const sec = (['all', 'crushes', 'gossip', 'campus', 'garba'].includes(val) ? val : 'all') as FeedSection;
    setSection(sec);
    router.replace(sec === 'all' ? '/?s=all' : `/?s=${sec}`, { scroll: false });
  };

  const handleSpillStory = async () => {
    if (seeding) return;
    setSeeding(true);
    const seedSec: PostSection | undefined = section === 'all' ? undefined : (section as PostSection);
    await seedSingleCampusStory(seedSec);
    await loadFeed(section, sortBy);
    setSeeding(false);
  };

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    const res = await getFeedPosts(section, sortBy, nextCursor);
    if (res.success && res.data) {
      setPosts(prev => [...prev, ...res.data!.posts]);
      setNextCursor(res.data.nextCursor);
    }
    setLoadingMore(false);
  };

  const sectionOptions = POST_SECTIONS.map(s => ({
    label: s.label,
    value: s.id,
  }));

  return (
    <div className="px-4 py-4">
      {/* Official Campus Notice & 1:00 PM Garba Countdown */}
      <CampusNoticeBanner />

      {/* 3 Section Chips */}
      <div className="mb-3">
        <FilterChips
          options={sectionOptions}
          selected={section}
          onSelect={handleSelectSection}
        />
      </div>

      {/* Sort Toggle (New / Hot) */}
      <div className="flex items-center justify-between px-1 py-1 mb-3">
        <span className="font-mono text-[11px] text-ink-soft">
          {section === 'all' && '🌟 All confessions from each & every section'}
          {section === 'crushes' && '💘 Anonymous confessions'}
          {section === 'gossip' && '🗣️ Spicy campus tea'}
          {section === 'campus' && '🏫 College updates & life'}
          {section === 'garba' && '🪩 Garba partner hunt & passes'}
        </span>
        <div className="inline-flex rounded-lg bg-ink/5 p-0.5">
          <button
            onClick={() => setSortBy('new')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-all ${
              sortBy === 'new'
                ? 'bg-card text-ink font-bold shadow-sm'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            New
          </button>
          <button
            onClick={() => setSortBy('hot')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-all ${
              sortBy === 'hot'
                ? 'bg-card text-coral font-bold shadow-sm'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Hot 🔥
          </button>
        </div>
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin text-3xl">📌</div>
          <p className="font-body text-xs text-ink-soft mt-2">Loading confessions...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center bg-card/60 rounded-2xl border border-dashed border-ink/10 my-4 p-6">
          <div className="text-4xl mb-3">🫥</div>
          <p className="font-display font-semibold text-ink text-sm">
            Board is empty right now
          </p>
          <p className="font-body text-xs text-ink-soft mt-1">
            Be the first to spill the tea or confess anonymously!
          </p>
          <button
            onClick={handleSpillStory}
            disabled={seeding}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green/10 hover:bg-green/20 text-green font-medium text-xs transition-colors disabled:opacity-50"
          >
            {seeding ? 'Generating tea... ⏳' : '✨ Spill a Campus Story'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}

          {/* Load More */}
          {nextCursor && (
            <div className="text-center pt-4 pb-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-4 py-2 rounded-xl bg-ink/5 hover:bg-ink/10 font-mono text-xs text-ink-soft transition-colors"
              >
                {loadingMore ? 'Loading more...' : 'Load more posts ⬇'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <div className="inline-block animate-spin text-3xl">📌</div>
        </div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}
