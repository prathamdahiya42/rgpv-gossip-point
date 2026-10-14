'use client';

import { useState, useTransition } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { reportContent } from '@/actions/reports';
import { REPORT_REASONS } from '@/types';
import type { ReportTargetType } from '@/types';
import { useToast } from '@/context/ToastContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
}

export default function ReportModal({ isOpen, onClose, targetType, targetId }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleSubmit = () => {
    if (!selectedReason) return;

    startTransition(async () => {
      const result = await reportContent(targetType, targetId, selectedReason);
      if (result.success) {
        showToast('Report submitted. Flagged for review 🛡️', 'success');
        onClose();
        setSelectedReason('');
      } else {
        showToast(result.error || 'Failed to report', 'error');
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Content">
      <p className="font-body text-xs text-ink-soft mb-3">
        Why are you reporting this? Content flagged 3 times is automatically hidden.
      </p>
      <div className="space-y-2">
        {REPORT_REASONS.map(reason => (
          <button
            key={reason}
            onClick={() => setSelectedReason(reason)}
            className={`
              w-full text-left px-4 py-2.5 rounded-xl capitalize
              font-body text-sm transition-all duration-200
              ${selectedReason === reason
                ? 'bg-coral-soft text-coral border border-coral/30 font-medium'
                : 'bg-ink/5 text-ink hover:bg-ink/10'
              }
            `}
          >
            {reason}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="ghost" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleSubmit}
          loading={isPending}
          disabled={!selectedReason}
          className="flex-1"
        >
          Submit Report
        </Button>
      </div>
    </Modal>
  );
}
