'use client';

import { Badge } from '@/components/ui/badge';

interface Signal {
  id: string;
  name: string;
  severity?: string;
  sourceParticipantId?: string;
  ts: string;
  confidence?: number;
  payload?: Record<string, unknown>;
}

interface SignalTimelineOverlayProps {
  leftSignals: Signal[];
  rightSignals: Signal[];
  leftLabel: string;
  rightLabel: string;
}

export function SignalTimelineOverlay({
  leftSignals,
  rightSignals,
  leftLabel,
  rightLabel
}: SignalTimelineOverlayProps) {
  const allSignals = [
    ...leftSignals.map((s) => ({ ...s, side: 'left' as const })),
    ...rightSignals.map((s) => ({ ...s, side: 'right' as const }))
  ].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  if (allSignals.length === 0) {
    return <p className="muted small">No signals emitted in either run.</p>;
  }

  const severityTone = (severity?: string) => {
    if (severity === 'critical' || severity === 'high') return 'danger' as const;
    if (severity === 'medium' || severity === 'warning') return 'warning' as const;
    return 'info' as const;
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
        <span className="muted small">
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--brand)',
              marginRight: 6
            }}
          />
          {leftLabel}
        </span>
        <span className="muted small">
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--brand-2)',
              marginRight: 6
            }}
          />
          {rightLabel}
        </span>
      </div>
      <div className="list">
        {allSignals.map((signal) => (
          <div
            key={`${signal.side}-${signal.id}`}
            className="list-item"
            style={{ borderLeft: `3px solid ${signal.side === 'left' ? 'var(--brand)' : 'var(--brand-2)'}` }}
          >
            <div className="list-item-title">
              {signal.name}
              {signal.severity ? <Badge label={signal.severity} tone={severityTone(signal.severity)} /> : null}
            </div>
            <div className="list-item-meta">
              {signal.side === 'left' ? leftLabel : rightLabel} · {new Date(signal.ts).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
