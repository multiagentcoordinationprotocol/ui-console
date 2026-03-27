'use client';

import Link from 'next/link';
import { ArrowRightLeft, RotateCcw, Square, TimerReset } from 'lucide-react';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { RunRecord } from '@/lib/types';
import { formatCurrency, formatDateTime, formatNumber, formatRelativeDuration } from '@/lib/utils/format';
import { getRunDurationMs } from '@/lib/utils/macp';

export function RunOverviewCard({
  run,
  connectionStatus,
  reconnectAttempt,
  onCancel,
  onReplay,
  compareHref
}: {
  run: RunRecord;
  connectionStatus?: string;
  reconnectAttempt?: number;
  onCancel?: () => void;
  onReplay?: () => void;
  compareHref?: string;
}) {
  const durationMs = Number(run.metadata?.durationMs ?? getRunDurationMs(run));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{String(run.metadata?.scenarioRef ?? run.source?.ref ?? 'Run detail')}</CardTitle>
        <CardDescription>
          Run {run.id} · started {formatDateTime(run.startedAt ?? run.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="stack">
        <div className="inline-list">
          <StatusBadge status={run.status} />
          <Badge label={String(run.metadata?.templateId ?? 'default')} />
          <Badge label={String(run.metadata?.environment ?? 'unknown')} tone="info" />
          {connectionStatus ? (
            <Badge
              label={
                connectionStatus === 'reconnecting' && reconnectAttempt
                  ? `stream:reconnecting (${reconnectAttempt})`
                  : `stream:${connectionStatus}`
              }
              tone={
                connectionStatus === 'live'
                  ? 'success'
                  : connectionStatus === 'reconnecting'
                    ? 'warning'
                    : connectionStatus === 'error'
                      ? 'danger'
                      : 'neutral'
              }
            />
          ) : null}
        </div>

        <div className="metric-strip">
          <div className="metric-box">
            <div className="muted small">Elapsed</div>
            <div className="metric-box-value">{formatRelativeDuration(durationMs)}</div>
          </div>
          <div className="metric-box">
            <div className="muted small">Tokens</div>
            <div className="metric-box-value">{formatNumber(Number(run.metadata?.totalTokens ?? 0))}</div>
          </div>
          <div className="metric-box">
            <div className="muted small">Estimated cost</div>
            <div className="metric-box-value">{formatCurrency(Number(run.metadata?.estimatedCostUsd ?? 0))}</div>
          </div>
        </div>

        <div className="section-actions">
          {run.status === 'running' && onCancel ? (
            <Button variant="danger" onClick={onCancel}>
              <Square size={16} />
              Cancel run
            </Button>
          ) : null}
          {onReplay ? (
            <Button variant="secondary" onClick={onReplay}>
              <TimerReset size={16} />
              Replay
            </Button>
          ) : null}
          <Link href="/runs/new" className="button button-secondary">
            <RotateCcw size={16} />
            Clone / rerun
          </Link>
          {compareHref ? (
            <Link href={compareHref} className="button button-ghost">
              <ArrowRightLeft size={16} />
              Compare
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
