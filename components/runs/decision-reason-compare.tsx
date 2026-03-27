'use client';

import { Badge } from '@/components/ui/badge';
import type { RunStateProjection } from '@/lib/types';
import { formatPercent } from '@/lib/utils/format';

interface DecisionReasonCompareProps {
  leftState: RunStateProjection;
  rightState: RunStateProjection;
  leftLabel: string;
  rightLabel: string;
}

function ConfidenceBar({ value }: { value?: number }) {
  const pct = value != null ? (value <= 1 ? value * 100 : value) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--panel-3)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${Math.min(pct, 100)}%`,
            height: '100%',
            borderRadius: 4,
            background: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)'
          }}
        />
      </div>
      <span className="muted small">{formatPercent(value)}</span>
    </div>
  );
}

export function DecisionReasonCompare({ leftState, rightState, leftLabel, rightLabel }: DecisionReasonCompareProps) {
  const ld = leftState.decision;
  const rd = rightState.decision;
  const leftAction = ld.current?.action ?? 'pending';
  const rightAction = rd.current?.action ?? 'pending';

  return (
    <div className="grid-2">
      {[
        { label: leftLabel, d: ld },
        { label: rightLabel, d: rd }
      ].map(({ label, d }) => {
        const action = d.current?.action ?? 'pending';
        const confidence = d.current?.confidence;
        const reasons = d.current?.reasons ?? [];
        return (
          <div key={label} className="stack">
            <h4>{label}</h4>
            <div className="inline-list">
              <Badge
                label={action}
                tone={action === 'approved' ? 'success' : action === 'declined' ? 'danger' : 'neutral'}
              />
            </div>
            <ConfidenceBar value={confidence} />
            {reasons.length > 0 ? (
              <ol style={{ paddingLeft: '1.25rem', margin: 0 }}>
                {reasons.map((reason: string, i: number) => (
                  <li key={i} className="muted small" style={{ marginBottom: '0.25rem' }}>
                    {reason}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted small">No reasons recorded.</p>
            )}
          </div>
        );
      })}
      {leftAction !== rightAction ? (
        <div style={{ gridColumn: '1 / -1' }}>
          <Badge label="decisions differ" tone="warning" />
        </div>
      ) : null}
    </div>
  );
}
