'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { RunStateProjection } from '@/lib/types';
import { formatDateTime, formatPercent } from '@/lib/utils/format';

export function SignalRail({
  state,
  runId
}: {
  state: RunStateProjection;
  /** When provided, the "Open in full view" link targets the signal-filtered /logs view. */
  runId?: string;
}) {
  const fullViewHref = runId ? `/logs?runId=${runId}&type=signal.emitted` : '/logs?type=signal.emitted';

  return (
    <Card>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <CardTitle>Signal rail</CardTitle>
            <CardDescription>
              Side-channel updates, confidence spikes, and anomaly indicators emitted during the run.
            </CardDescription>
          </div>
          <Link href={fullViewHref} className="panel-action" aria-label="Open signals in full view">
            <ExternalLink size={12} style={{ verticalAlign: '-1px', marginRight: 4 }} />
            Open in full view
          </Link>
        </div>
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
