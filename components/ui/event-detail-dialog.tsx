'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonViewer } from '@/components/ui/json-viewer';
import { useToast } from '@/components/ui/toast';

/**
 * PR-A5 — EventDetailDialog.
 *
 * Shared modal for click-through detail on event-feed rows (B1), span
 * rows on /traces (D4), and metric rows in the Prometheus table (D3).
 * Uses the native `<dialog>` element — same pattern as
 * `confirmation-dialog.tsx`, so focus-trap / esc-to-close / backdrop
 * are browser-provided.
 *
 * The dialog is framing only — callers pass the heading block, metadata
 * rows, and a payload value (rendered via JsonViewer + Copy JSON button).
 *
 * Usage:
 *   <EventDetailDialog
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     title="Event payload"
 *     subtitle={`seq ${event.seq} · ${event.type}`}
 *     meta={[{ label: 'Subject', value: <code>{subject}</code> }, ...]}
 *     payload={event.data}
 *   />
 */
export interface EventDetailDialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Small line under the title — e.g. seq + type. Optional. */
  subtitle?: ReactNode;
  /** Key/value rows shown above the payload (ts, subject, source, trace id...). */
  meta?: Array<{ label: ReactNode; value: ReactNode }>;
  /** The JSON payload shown in a scrollable viewer. Copied verbatim to clipboard. */
  payload: unknown;
  /** Optional extra content (e.g. linked artifact list). */
  children?: ReactNode;
}

export function EventDetailDialog({ open, onClose, title, subtitle, meta, payload, children }: EventDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // jsdom (unit-test environment) doesn't implement `showModal`/`close`.
    // Guard both so the component renders deterministically in tests and
    // falls back to a plain-container render.
    if (typeof dialog.showModal !== 'function') return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Translate native close (Esc, backdrop click) to the controlled prop.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handler = () => {
      if (open) onClose();
    };
    dialog.addEventListener('close', handler);
    return () => dialog.removeEventListener('close', handler);
  }, [open, onClose]);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast('success', 'Payload copied to clipboard');
    } catch {
      toast('error', 'Copy failed — clipboard unavailable');
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="event-detail-dialog"
      aria-labelledby="event-detail-title"
      // jsdom doesn't surface children in <dialog> unless the `open`
      // attribute is set. Set it directly as a fallback; real browsers
      // prefer showModal() (called in the effect above) which also sets
      // this attribute — idempotent either way.
      open={open || undefined}
    >
      <div className="event-detail-header">
        <div>
          <div className="event-detail-title" id="event-detail-title">
            {title}
          </div>
          {subtitle ? <div className="event-detail-subtitle">{subtitle}</div> : null}
        </div>
        <div style={{ display: 'inline-flex', gap: 8 }}>
          <Button variant="ghost" onClick={copyJson} aria-label="Copy JSON payload">
            <Copy size={14} /> Copy JSON
          </Button>
          <Button variant="ghost" onClick={onClose} aria-label="Close dialog">
            <X size={14} />
          </Button>
        </div>
      </div>

      {meta && meta.length > 0 ? (
        <dl className="event-detail-meta">
          {meta.map((item, i) => (
            <div key={i} className="event-detail-meta-row">
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="event-detail-payload">
        <JsonViewer value={payload} maxHeight={480} />
      </div>

      {children ? <div className="event-detail-extra">{children}</div> : null}
    </dialog>
  );
}
