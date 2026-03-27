'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { RunStateProjection } from '@/lib/types';
import { formatDateTime, formatPercent } from '@/lib/utils/format';

export function SignalRail({ state }: { state: RunStateProjection }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Signal rail</CardTitle>
        <CardDescription>
          Side-channel updates, confidence spikes, and anomaly indicators emitted during the run.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="signal-list">
          {state.signals.signals.length === 0 ? (
            <div className="empty-state compact">
              <h4>No signals yet</h4>
              <p>Signals will appear here as each specialist agent emits observations.</p>
            </div>
          ) : (
            state.signals.signals
              .slice()
              .reverse()
              .map((signal) => (
                <div key={signal.id} className="signal-item">
                  <div>
                    <div className="list-item-title">{signal.name}</div>
                    <div className="list-item-meta">
                      {formatDateTime(signal.ts)} · from {signal.sourceParticipantId ?? 'unknown'}
                    </div>
                    <div className="muted small">Confidence {formatPercent(signal.confidence ?? 0)}</div>
                  </div>
                  <Badge
                    label={signal.severity ?? 'info'}
                    tone={signal.severity === 'high' ? 'danger' : signal.severity === 'medium' ? 'warning' : 'info'}
                  />
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
