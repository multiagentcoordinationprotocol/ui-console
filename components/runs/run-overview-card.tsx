'use client';

import Link from 'next/link';
import { ArrowRightLeft, ExternalLink, RotateCcw, Search, Square, TimerReset } from 'lucide-react';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { MetricsSummary, RunRecord, RunStateProjection } from '@/lib/types';
import { formatDateTime, formatNumber, formatRelativeDuration } from '@/lib/utils/format';
import { getRunDurationMs } from '@/lib/utils/macp';

/**
 * Run statuses considered "live" for the purposes of counter sourcing.
 * Decision Q1 (plans/ui-improvement-plan.md): during live statuses the
 * counters tick from the SSE projection; once terminal, from the
 * persisted metrics aggregate.
 */
const LIVE_STATUSES = new Set(['queued', 'starting', 'binding_session', 'running']);

export function RunOverviewCard({
  run,
  state,
  metrics,
  connectionStatus,
  reconnectAttempt,
  onCancel,
  onReplay,
  compareHref,
  traceId,
  jaegerUiUrl
}: {
  run: RunRecord;
  /** SSE projection — used for live counter sources (Q1). Omit for historical replay contexts. */
  state?: RunStateProjection;
  metrics?: MetricsSummary | null;
  connectionStatus?: string;
  reconnectAttempt?: number;
  onCancel?: () => void;
  onReplay?: () => void;
  compareHref?: string;
  traceId?: string;
  jaegerUiUrl?: string;
}) {
  const durationMs = metrics?.durationMs ?? Number(run.metadata?.durationMs ?? getRunDurationMs(run));

  const scenarioRef = run.source?.ref ?? run.metadata?.scenarioRef;
  const environment = process.env.NEXT_PUBLIC_MACP_ENVIRONMENT_LABEL ?? run.metadata?.environment;
  const showStream = connectionStatus && connectionStatus !== 'ended';

  // Q1 decision — event/message counter sources switch on run.status.
  // Live: SSE projection (ticks in real time). Terminal: metrics aggregate.
  const isLive = LIVE_STATUSES.has(run.status);
  const eventCount = isLive ? (state?.timeline.totalEvents ?? 0) : (metrics?.eventCount ?? 0);
  const messageCount = isLive ? (state?.outboundMessages?.total ?? 0) : (metrics?.messageCount ?? 0);
  const signalCount = metrics?.signalCount ?? state?.signals?.signals.length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{scenarioRef ? `Scenario: ${String(scenarioRef)}` : 'Run detail'}</CardTitle>
        <CardDescription>
          Run {run.id} · started {formatDateTime(run.startedAt ?? run.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent className="stack">
        <div className="inline-list">
          <StatusBadge status={run.status} />
          {run.metadata?.templateId ? <Badge label={String(run.metadata.templateId)} /> : null}
          {environment ? <Badge label={String(environment)} tone="info" /> : null}
          {showStream ? (
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
            <div className="muted small">Events</div>
            <div className="metric-box-value">{formatNumber(eventCount)}</div>
          </div>
          <div className="metric-box">
            <div className="muted small">Messages</div>
            <div className="metric-box-value">{formatNumber(messageCount)}</div>
          </div>
          <div className="metric-box">
            <div className="muted small">Signals</div>
            <div className="metric-box-value">{formatNumber(signalCount)}</div>
          </div>
          {/* Q3: Tokens + Est. cost live in the Run observability summary,
              not the top overview card. Removed from here to avoid duplication. */}
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
          {traceId && traceId !== '00000000000000000000000000000000' ? (
            <Link href={`/traces?runId=${run.id}`} className="button button-ghost">
              <Search size={16} />
              Traces
            </Link>
          ) : null}
          {jaegerUiUrl ? (
            <a href={jaegerUiUrl} target="_blank" rel="noopener noreferrer" className="button button-ghost">
              <ExternalLink size={16} />
              Jaeger
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
