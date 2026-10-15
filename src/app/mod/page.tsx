'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { useMod } from '@/context/ModContext';
import { useToast } from '@/context/ToastContext';

export default function ModPortalPage() {
  const { isMod, unlockMod, lockMod } = useMod();
  const { showToast } = useToast();
  const [passcode, setPasscode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const res = await unlockMod(passcode.trim());
    if (res.success) {
      showToast('🛡️ Moderator mode activated!', 'success');
      setPasscode('');
    } else {
      showToast(res.error || 'Incorrect passcode', 'error');
    }
    setIsSubmitting(false);
  };

  const handleLock = () => {
    lockMod();
    showToast('Moderator mode locked', 'info');
  };

  return (
    <div className="px-4 py-8 max-w-md mx-auto">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#FFFDF9] to-[#FFF7EB] border-2 border-amber-300 shadow-sm text-ink">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🛡️</span>
          <h1 className="font-display font-bold text-xl text-amber-950">
            Campus Moderator Portal
          </h1>
        </div>

        <p className="text-xs text-ink-soft mb-6 leading-relaxed font-body">
          Built for campus admins & respected seniors of UIT, SOIT & RGPV. This gives you instant authority to <strong>✏️ Edit</strong> or <strong>🗑️ Delete</strong> inappropriate posts, personal mentions, or abusive comments across the entire site.
        </p>

        {isMod ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950">
              <div className="flex items-center gap-2 mb-1.5 font-bold font-display text-sm text-emerald-900">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Moderation Mode is ACTIVE on this device
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed font-body">
                Red <strong>🗑️ Remove</strong> and amber <strong>✏️ Edit</strong> buttons are now visible on all posts and comments in your feed and post pages.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/"
                className="w-full py-2.5 px-4 rounded-xl bg-green text-white font-display font-semibold text-sm hover:bg-green/90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Return to Campus Feed</span>
                <span>📌</span>
              </Link>

              <Button
                variant="secondary"
                onClick={handleLock}
                className="w-full text-red-600 hover:bg-red-50"
              >
                🔒 Lock / Deactivate Mod Mode
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] font-semibold text-amber-950 uppercase tracking-wider mb-1.5">
                Enter Secret Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter moderator passcode..."
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-white border border-amber-300/80 font-mono text-sm text-ink placeholder:text-ink-soft/40 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              disabled={!passcode.trim()}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              size="lg"
            >
              Activate Mod Mode 🛡️
            </Button>
          </form>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="font-mono text-xs text-ink-soft hover:text-green transition-colors">
          ← Back to RGPV Gossip Point
        </Link>
      </div>
    </div>
  );
}
