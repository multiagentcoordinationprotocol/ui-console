'use client';

import { Badge, StatusBadge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { RunRecord, RunStateProjection } from '@/lib/types';
import { formatPercent, titleCase } from '@/lib/utils/format';

export function DecisionPanel({ run, state }: { run: RunRecord; state: RunStateProjection }) {
  const current = state.decision.current;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Final decision and resolution path</CardTitle>
        <CardDescription>
          Decision transparency across contributors, fallback handling, and final emitted output.
        </CardDescription>
      </CardHeader>
      <CardContent className="stack">
        <div className="inline-list">
          <StatusBadge status={run.status} />
          <Badge label={String(run.metadata?.modeName ?? state.run.modeName ?? 'mode')} tone="info" />
          <Badge label={String(run.metadata?.environment ?? 'unknown')} />
        </div>

        <div className="metric-strip">
          <div className="metric-box">
            <div className="muted small">Action</div>
            <div className="metric-box-value" style={{ fontSize: '1.1rem' }}>
              {current?.action
                ? titleCase(current.action.replace(/_/g, ' '))
                : String(run.metadata?.finalAction ?? 'Pending')}
            </div>
          </div>
          <div className="metric-box">
            <div className="muted small">Confidence</div>
            <div className="metric-box-value">
              {formatPercent(current?.confidence ?? Number(run.metadata?.finalConfidence ?? 0))}
            </div>
          </div>
          <div className="metric-box">
            <div className="muted small">Finalized</div>
            <div className="metric-box-value">{current?.finalized || run.status === 'completed' ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div className="list-item">
          <div className="list-item-title">Decision composition</div>
          <div className="list-item-meta">
            {current?.reasons?.length
              ? current.reasons.join(' · ')
              : 'The current projection has not emitted a final reason vector yet.'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
