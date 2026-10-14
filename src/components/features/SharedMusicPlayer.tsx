'use client';

import { useState } from 'react';
import type { SharedTrack } from '@/types';

export const TRENDING_CAMPUS_TRACKS: { title: string; genre: string; youtubeId: string }[] = [
  { title: 'Seedhe Maut - Namastute', genre: '🔥 Rap', youtubeId: 'e2Q7vC7V2y8' },
  { title: 'DIVINE - Mirchi', genre: '🔥 Hip-Hop', youtubeId: '2b_k2l_vHfg' },
  { title: 'Diljit Dosanjh - Born to Shine', genre: '🪕 Punjabi', youtubeId: '0pWsCiBvLOk' },
  { title: 'Karan Aujla - Softly', genre: '🪕 Punjabi', youtubeId: 'cWMxCE2HTag' },
  { title: 'Anuv Jain - Baarishein', genre: '☕ Indie', youtubeId: 'PJWemSzExXs' },
  { title: 'Chogada Tara - Garba EDM', genre: '🪩 Garba', youtubeId: 'd4TuL3zLz5k' },
];

interface SharedMusicPlayerProps {
  currentTrack: SharedTrack | null;
  onShareTrack: (urlOrId: string, title?: string) => Promise<boolean>;
}

export default function SharedMusicPlayer({
  currentTrack,
  onShareTrack,
}: SharedMusicPlayerProps) {
  const [showModal, setShowModal] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleShareCustom = async () => {
    if (!customUrl.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const success = await onShareTrack(customUrl.trim(), customTitle.trim() || undefined);
    if (success) {
      setCustomUrl('');
      setCustomTitle('');
      setShowModal(false);
    }
    setIsSubmitting(false);
  };

  const handlePickTrending = async (track: { title: string; youtubeId: string }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const success = await onShareTrack(track.youtubeId, track.title);
    if (success) {
      setShowModal(false);
    }
    setIsSubmitting(false);
  };

  return (
    <>
      {/* If a track is active, show the Now Playing Together bar */}
      {currentTrack ? (
        <div className="bg-gradient-to-r from-amber-500/15 via-paper to-amber-500/15 border-b border-amber-500/20 px-3 py-2 text-xs">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm animate-pulse">🎶</span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Listening Together:
              </span>
              <span className="font-display font-semibold text-xs text-ink truncate max-w-[160px]">
                {currentTrack.title}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="px-2 py-0.5 rounded bg-ink/5 hover:bg-ink/10 text-[10px] font-mono text-ink-soft transition-colors"
                title={isCollapsed ? 'Show player' : 'Hide video'}
              >
                {isCollapsed ? 'Show' : 'Mini'}
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-[10px] font-mono text-amber-800 dark:text-amber-200 transition-colors font-semibold"
                title="Change or share a new song"
              >
                Change 🎵
              </button>
            </div>
          </div>

          {/* Embedded YouTube Player (Privacy-enhanced mode) */}
          {!isCollapsed && (
            <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-video max-h-40 shadow-xs mt-1.5">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?autoplay=1&enablejsapi=1&playsinline=1`}
                title={currentTrack.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          )}
        </div>
      ) : (
        /* If no track has been shared yet, provide a quick invite pill */
        <div className="bg-paper/80 border-b border-ink/5 px-3 py-1.5 flex items-center justify-between text-xs">
          <span className="font-body text-[11px] text-ink-soft flex items-center gap-1">
            <span>🎧</span> Share a song to vibe to together!
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="px-2.5 py-1 rounded-lg bg-green/10 hover:bg-green/20 text-green font-mono text-[10px] font-semibold transition-colors"
          >
            + Share Song 🎵
          </button>
        </div>
      )}

      {/* Share Song Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-ink/10 shadow-xl overflow-hidden p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🎵</span>
                <h3 className="font-display font-bold text-sm text-ink">
                  Share a Song with Partner
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full text-ink-soft hover:text-ink hover:bg-ink/5 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Custom YouTube Link Input */}
            <div className="space-y-2">
              <label className="block font-mono text-[10px] uppercase text-ink-soft font-semibold">
                Paste any YouTube song link:
              </label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="e.g. https://youtu.be/... or video ID"
                className="w-full px-3 py-2 rounded-xl bg-paper border border-ink/10 font-body text-xs text-ink placeholder:text-ink-soft/40 focus:outline-none focus:ring-2 focus:ring-green/30"
              />
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Song title (optional)"
                maxLength={60}
                className="w-full px-3 py-1.5 rounded-xl bg-paper border border-ink/10 font-body text-xs text-ink placeholder:text-ink-soft/40 focus:outline-none focus:ring-2 focus:ring-green/30"
              />
              <button
                onClick={handleShareCustom}
                disabled={!customUrl.trim() || isSubmitting}
                className="w-full py-2 rounded-xl bg-green text-white font-body text-xs font-semibold hover:bg-green/90 transition-colors disabled:opacity-40"
              >
                {isSubmitting ? 'Sharing... ⏳' : 'Share & Play Together 🚀'}
              </button>
            </div>

            {/* Quick Pick Trending Campus Tracks */}
            <div>
              <p className="font-mono text-[10px] uppercase text-ink-soft font-semibold mb-2">
                Or quick-pick a campus favorite:
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {TRENDING_CAMPUS_TRACKS.map((t) => (
                  <button
                    key={t.youtubeId}
                    onClick={() => handlePickTrending(t)}
                    disabled={isSubmitting}
                    className="p-2 text-left rounded-xl bg-ink/5 hover:bg-green-soft border border-ink/5 hover:border-green/20 transition-all text-xs group"
                  >
                    <span className="block font-mono text-[9px] text-ink-soft group-hover:text-green">
                      {t.genre}
                    </span>
                    <span className="font-display font-medium text-ink text-[11px] truncate block">
                      {t.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
