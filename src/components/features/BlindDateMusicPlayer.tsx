'use client';

import { useState, useRef, useEffect } from 'react';

export interface Soundtrack {
  id: string;
  label: string;
  icon: string;
  url: string;
}

export const SOUNDTRACKS: Soundtrack[] = [
  {
    id: 'lofi',
    label: 'Canteen Lofi',
    icon: '🎧',
    // High quality royalty-free chill lofi stream/loop
    url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
  },
  {
    id: 'garba',
    label: 'Garba Beats',
    icon: '🪩',
    // Ambient festive rhythm
    url: 'https://actions.google.com/sounds/v1/foley/wood_creak_resonance.ogg',
  },
  {
    id: 'rain',
    label: 'Bhopal Rain',
    icon: '🌧️',
    // Gentle rain ambiance
    url: 'https://actions.google.com/sounds/v1/weather/gentle_rain_on_leaves.ogg',
  },
];

interface BlindDateMusicPlayerProps {
  initialVibe?: 'lofi' | 'garba' | 'rain';
}

export default function BlindDateMusicPlayer({ initialVibe = 'lofi' }: BlindDateMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Soundtrack>(() => {
    return SOUNDTRACKS.find((s) => s.id === initialVibe) || SOUNDTRACKS[0];
  });
  const [volume, setVolume] = useState(0.35); // Gentle background level
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn('Audio play notice:', err));
    }
  };

  const handleSelectTrack = (track: Soundtrack) => {
    setCurrentTrack(track);
    if (audioRef.current) {
      audioRef.current.src = track.url;
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-paper/70 border-b border-ink/5 text-xs">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentTrack.url}
        loop
        preload="none"
      />

      {/* Track selector + Equalizer animation */}
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className={`
            w-6 h-6 rounded-full flex items-center justify-center text-[11px] transition-colors
            ${isPlaying ? 'bg-green text-white animate-pulse' : 'bg-ink/5 text-ink-soft hover:bg-ink/10'}
          `}
          title={isPlaying ? 'Pause background vibe' : 'Play background vibe'}
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <span className="font-mono text-[10px] text-ink font-medium flex items-center gap-1">
          <span>{currentTrack.icon}</span>
          <span className="max-w-[90px] truncate">{currentTrack.label}</span>
          {isPlaying && (
            <span className="inline-flex gap-0.5 items-end h-2.5 ml-0.5">
              <span className="w-0.5 bg-green animate-bounce" style={{ height: '70%', animationDelay: '0ms' }} />
              <span className="w-0.5 bg-green animate-bounce" style={{ height: '100%', animationDelay: '150ms' }} />
              <span className="w-0.5 bg-green animate-bounce" style={{ height: '40%', animationDelay: '300ms' }} />
            </span>
          )}
        </span>
      </div>

      {/* Track options chips & Volume */}
      <div className="flex items-center gap-1.5">
        {SOUNDTRACKS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleSelectTrack(t)}
            className={`
              px-2 py-0.5 rounded-lg text-[10px] font-mono transition-colors
              ${currentTrack.id === t.id
                ? 'bg-ink/10 text-ink font-bold'
                : 'text-ink-soft hover:text-ink hover:bg-ink/5'}
            `}
            title={`Switch to ${t.label}`}
          >
            {t.icon}
          </button>
        ))}

        {/* Mute toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-1 rounded text-ink-soft hover:text-ink text-[11px] transition-colors ml-1"
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? '🔇' : '🔉'}
        </button>
      </div>
    </div>
  );
}
