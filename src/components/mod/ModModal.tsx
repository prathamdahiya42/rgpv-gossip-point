'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useMod } from '@/context/ModContext';
import { useToast } from '@/context/ToastContext';

export default function ModModal() {
  const { isMod, isModModalOpen, closeModModal, unlockMod, lockMod } = useMod();
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
      closeModModal();
    } else {
      showToast(res.error || 'Incorrect passcode', 'error');
    }
    setIsSubmitting(false);
  };

  const handleLock = () => {
    lockMod();
    showToast('Moderator mode locked', 'info');
    closeModModal();
  };

  return (
    <Modal isOpen={isModModalOpen} onClose={closeModModal} title="Campus Moderator Access 🛡️">
      <div className="space-y-4">
        {isMod ? (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-300">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Moderator Mode is ACTIVE
              </p>
              <p className="text-[11px] opacity-90 leading-relaxed">
                You and your trusted seniors can now directly <strong>✏️ Edit</strong> or <strong>🗑️ Remove</strong> any post or comment across the platform.
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={handleLock}
              className="w-full text-red-600 hover:bg-red-50"
            >
              🔒 Lock / Exit Moderator Mode
            </Button>
          </div>
        ) : (
          <form onSubmit={handleUnlock} className="space-y-3">
            <p className="text-xs text-ink-soft leading-relaxed">
              For campus admins & trusted seniors. Enter the secret passcode to unlock instant post and comment editing/removal tools on this device.
            </p>

            <div>
              <label className="block font-mono text-[10px] text-ink-soft uppercase tracking-wider mb-1">
                Moderator Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter secret passcode..."
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-ink/5 border border-ink/10 text-sm font-mono text-ink placeholder:text-ink-soft/40 focus:outline-none focus:ring-2 focus:ring-green/30"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                onClick={closeModModal}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                disabled={!passcode.trim()}
                className="flex-1"
              >
                Unlock 🛡️
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
