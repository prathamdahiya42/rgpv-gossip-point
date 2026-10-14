'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPost } from '@/actions/posts';
import Button from '@/components/ui/Button';
import { useAnon } from '@/context/AnonContext';
import { useToast } from '@/context/ToastContext';
import { POST_SECTIONS } from '@/types';
import type { PostSection } from '@/types';

const GARBA_TAGS = [
  '💃 Looking for Partner',
  '👥 Need a Group/Squad',
  '😅 Complete Noob (Teach me)',
  '🎟️ Passes / Venue Info',
] as const;

export default function ComposePage() {
  const { profile } = useAnon();
  const { showToast } = useToast();
  const router = useRouter();

  const [section, setSection] = useState<PostSection>('gossip');
  const [toCrush, setToCrush] = useState('');
  const [garbaTag, setGarbaTag] = useState<string>('💃 Looking for Partner');
  const [garbaClue, setGarbaClue] = useState('');
  const [body, setBody] = useState('');
  const [isPending, startTransition] = useTransition();

  let fullContent = body.trim();
  if (section === 'crushes' && toCrush.trim()) {
    fullContent = `To: ${toCrush.trim()}\n\n${body.trim()}`;
  } else if (section === 'garba') {
    const cluePart = garbaClue.trim() ? `\n[Spotting clue: ${garbaClue.trim()}]` : '';
    fullContent = `[${garbaTag}]${cluePart}\n\n${body.trim()}`;
  }

  const handleSubmit = () => {
    if (fullContent.length < 10) {
      showToast('Post must be at least 10 characters long', 'error');
      return;
    }
    if (fullContent.length > 500) {
      showToast('Post cannot exceed 500 characters', 'error');
      return;
    }

    startTransition(async () => {
      const result = await createPost(section, fullContent);
      if (result.success) {
        showToast('Pinned to the board 📌', 'success');
        router.push(`/?s=${section}`);
      } else {
        showToast(result.error || 'Failed to post', 'error');
      }
    });
  };

  return (
    <div className="px-4 py-6">
      <h1 className="font-display text-2xl font-bold text-ink mb-1">
        Pin something new
      </h1>
      <p className="font-body text-xs text-ink-soft mb-6">
        Posting anonymously as <span className="font-mono text-green font-semibold">{profile?.handle || 'Anonymous'}</span>
      </p>

      {/* Section Picker */}
      <div className="mb-5">
        <label className="block font-mono text-[10px] text-ink-soft uppercase tracking-wider mb-2">
          Section
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {POST_SECTIONS.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setSection(sec.id)}
              className={`
                py-2.5 px-2 rounded-xl font-display text-xs font-semibold
                border transition-all text-center
                ${section === sec.id
                  ? sec.id === 'garba'
                    ? 'bg-gradient-to-r from-coral to-amber-500 text-white border-transparent shadow-sm'
                    : 'bg-green text-white border-green shadow-sm'
                  : 'bg-card text-ink border-ink/10 hover:border-green/40'
                }
              `}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* Crushes optional "To:" input */}
      {section === 'crushes' && (
        <div className="mb-4">
          <label className="block font-mono text-[10px] text-ink-soft uppercase tracking-wider mb-1.5">
            To: (Optional)
          </label>
          <input
            type="text"
            value={toCrush}
            onChange={(e) => setToCrush(e.target.value)}
            placeholder="e.g. The guy in IT 3rd sem sitting in canteen..."
            maxLength={100}
            className="
              w-full px-4 py-2.5 rounded-xl
              bg-ink/5 border border-ink/10
              font-body text-sm text-ink
              placeholder:text-ink-soft/40
              focus:outline-none focus:ring-2 focus:ring-green/30
            "
          />
        </div>
      )}

      {/* Garba Tag & Clue Picker */}
      {section === 'garba' && (
        <div className="mb-5 space-y-3 p-3.5 rounded-2xl bg-coral-soft/40 border border-coral/20">
          <div>
            <label className="block font-mono text-[10px] text-coral font-bold uppercase tracking-wider mb-2">
              🪩 What are you looking for?
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {GARBA_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setGarbaTag(tag)}
                  className={`
                    px-2.5 py-1.5 rounded-xl text-left font-body text-[11px] font-medium transition-all
                    ${garbaTag === tag
                      ? 'bg-coral text-white shadow-xs'
                      : 'bg-card text-ink hover:bg-card/80 border border-coral/10'
                    }
                  `}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] text-coral font-bold uppercase tracking-wider mb-1">
              Spotting clue / Outfit color (Optional)
            </label>
            <input
              type="text"
              value={garbaClue}
              onChange={(e) => setGarbaClue(e.target.value)}
              placeholder="e.g. Yellow kurta with black watch, near canteen gate"
              maxLength={80}
              className="
                w-full px-3 py-2 rounded-xl
                bg-card border border-coral/20
                font-body text-xs text-ink
                placeholder:text-ink-soft/40
                focus:outline-none focus:ring-2 focus:ring-coral/30
              "
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mb-6">
        <label className="block font-mono text-[10px] text-ink-soft uppercase tracking-wider mb-1.5">
          {section === 'crushes'
            ? 'Your confession'
            : section === 'garba'
            ? 'Garba details & message'
            : 'What’s the tea?'}
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            section === 'crushes'
              ? 'Confess your crush anonymously...'
              : section === 'garba'
              ? 'Tell people what day you are going, your dance skill level, or ask who has extra passes...'
              : section === 'gossip'
              ? 'Spill campus gossip, canteen drama, hostel tea...'
              : 'Share college news, exam thoughts, prof stories...'
          }
          rows={6}
          maxLength={500}
          className="
            w-full px-4 py-3 rounded-xl
            bg-ink/5 border border-ink/10
            font-body text-sm text-ink
            focus:outline-none focus:ring-2 focus:ring-green/30
            placeholder:text-ink-soft/40
            resize-none
            transition-all
          "
          autoFocus
        />
        <div className="flex justify-between items-center mt-2">
          <p className="font-mono text-[10px] text-ink-soft/70">
            Keep it anonymous. No phone/emails/handles.
          </p>
          <p className={`font-mono text-[10px] ${fullContent.length > 500 ? 'text-coral font-bold' : 'text-ink-soft'}`}>
            {fullContent.length}/500
          </p>
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        loading={isPending}
        disabled={fullContent.length < 10 || fullContent.length > 500}
        className="w-full"
        size="lg"
      >
        Pin it 📌
      </Button>
    </div>
  );
}
