'use client';

import { useCallback, useRef, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel
}: ConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    },
    [onCancel]
  );

  if (!open) return null;

  return (
    <dialog ref={dialogRef} className="confirmation-dialog-backdrop" onKeyDown={handleKeyDown}>
      <div
        className="confirmation-dialog"
        role="alertdialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
      >
        <div className="confirmation-dialog-icon">
          <AlertTriangle size={24} />
        </div>
        <h3 id="confirm-title" className="confirmation-dialog-title">
          {title}
        </h3>
        <p id="confirm-desc" className="confirmation-dialog-description">
          {description}
        </p>
        <div className="confirmation-dialog-actions">
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
