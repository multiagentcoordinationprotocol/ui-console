'use client';

import { useCallback, useState } from 'react';

interface ConfirmationState {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'danger' | 'primary';
  onConfirm: () => void;
}

const INITIAL: ConfirmationState = {
  open: false,
  title: '',
  description: '',
  confirmLabel: 'Confirm',
  variant: 'danger',
  onConfirm: () => {}
};

export function useConfirmation() {
  const [state, setState] = useState<ConfirmationState>(INITIAL);

  const confirm = useCallback(
    (opts: { title: string; description: string; confirmLabel?: string; variant?: 'danger' | 'primary' }) => {
      return new Promise<boolean>((resolve) => {
        setState({
          open: true,
          title: opts.title,
          description: opts.description,
          confirmLabel: opts.confirmLabel ?? 'Confirm',
          variant: opts.variant ?? 'danger',
          onConfirm: () => {
            setState(INITIAL);
            resolve(true);
          }
        });
      });
    },
    []
  );

  const cancel = useCallback(() => {
    setState(INITIAL);
  }, []);

  return { state, confirm, cancel };
}
