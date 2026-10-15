'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useMod } from '@/context/ModContext';
import { adminEditPost } from '@/actions/admin';
import { useToast } from '@/context/ToastContext';

interface EditPostModalProps {
  onPostUpdated?: (postId: string, newBody: string) => void;
}

export default function EditPostModal({ onPostUpdated }: EditPostModalProps) {
  const { editingPost, setEditingPost, modPasscode } = useMod();
  const { showToast } = useToast();
  const [bodyText, setBodyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingPost) {
      setBodyText(editingPost.body);
    }
  }, [editingPost]);

  if (!editingPost) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !modPasscode || isSubmitting) return;

    const trimmed = bodyText.trim();
    if (trimmed.length < 5 || trimmed.length > 500) {
      showToast('Post content must be between 5 and 500 characters', 'error');
      return;
    }

    setIsSubmitting(true);
    const res = await adminEditPost(editingPost.id, trimmed, modPasscode);
    if (res.success) {
      showToast('Post updated by Moderator ✏️', 'success');
      if (onPostUpdated) {
        onPostUpdated(editingPost.id, trimmed);
      }
      setEditingPost(null);
    } else {
      showToast(res.error || 'Failed to edit post', 'error');
    }
    setIsSubmitting(false);
  };

  return (
    <Modal
      isOpen={Boolean(editingPost)}
      onClose={() => setEditingPost(null)}
      title="Edit Campus Post ✏️"
    >
      <form onSubmit={handleSave} className="space-y-3">
        <p className="text-xs text-ink-soft">
          Modify inappropriate wording, remove offensive names, or fix sensitive details:
        </p>

        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={5}
          maxLength={500}
          className="w-full px-3.5 py-2.5 rounded-xl bg-ink/5 border border-ink/10 text-sm font-body text-ink focus:outline-none focus:ring-2 focus:ring-green/30 resize-none"
          autoFocus
        />

        <div className="flex justify-between items-center text-[10px] font-mono text-ink-soft">
          <span>Max 500 characters</span>
          <span>{bodyText.length}/500</span>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setEditingPost(null)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={!bodyText.trim() || bodyText.trim() === editingPost.body}
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
