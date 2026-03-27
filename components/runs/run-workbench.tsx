'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pause, Play, RefreshCw } from 'lucide-react';
import { ExecutionGraph } from '@/components/runs/execution-graph';
import { LiveEventFeed } from '@/components/runs/live-event-feed';
import { NodeInspector } from '@/components/runs/node-inspector';
import { DecisionPanel } from '@/components/runs/decision-panel';
import { RunOverviewCard } from '@/components/runs/run-overview-card';
import { SignalRail } from '@/components/runs/signal-rail';
import { TimelineScrubber } from '@/components/runs/timeline-scrubber';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { JsonViewer } from '@/components/ui/json-viewer';
import { Select } from '@/components/ui/field';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingPanel, ErrorPanel } from '@/components/ui/state-panels';
import {
  cancelRun,
  createReplay,
  getMockFrames,
  getQuickCompareTarget,
  getTimelineFrame,
  getRun,
  getRunArtifacts,
  getRunEvents,
  getRunMessages,
  getRunMetrics,
  getRunState,
  getRunTraces
} from '@/lib/api/client';
import { useLiveRun } from '@/lib/hooks/use-live-run';
import { usePreferencesStore } from '@/lib/stores/preferences-store';
import { formatDateTime, formatRelativeDuration } from '@/lib/utils/format';
import { getRunDurationMs } from '@/lib/utils/macp';

export function RunWorkbench({ runId, liveMode = false }: { runId: string; liveMode?: boolean }) {
  const demoMode = usePreferencesStore((state) => state.demoMode);
  const autoFollow = usePreferencesStore((state) => state.autoFollow);
  const setAutoFollow = usePreferencesStore((state) => state.setAutoFollow);
  const showCriticalPath = usePreferencesStore((state) => state.showCriticalPath);
  const setShowCriticalPath = usePreferencesStore((state) => state.setShowCriticalPath);
  const showParallelBranches = usePreferencesStore((state) => state.showParallelBranches);
  const setShowParallelBranches = usePreferencesStore((state) => state.setShowParallelBranches);
  const queryClient = useQueryClient();
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [replayDescriptorJson, setReplayDescriptorJson] = useState<Record<string, unknown> | undefined>();
  const [replaySeq, setReplaySeq] = useState<number | undefined>();

  const runQuery = useQuery({ queryKey: ['run', runId, demoMode], queryFn: () => getRun(runId, demoMode) });
  const stateQuery = useQuery({
    queryKey: ['run-state', runId, demoMode],
    queryFn: () => getRunState(runId, demoMode)
  });
  const eventsQuery = useQuery({
    queryKey: ['run-events', runId, demoMode],
    queryFn: () => getRunEvents(runId, demoMode)
  });
  const metricsQuery = useQuery({
    queryKey: ['run-metrics', runId, demoMode],
    queryFn: () => getRunMetrics(runId, demoMode)
  });
  const tracesQuery = useQuery({
    queryKey: ['run-traces', runId, demoMode],
    queryFn: () => getRunTraces(runId, demoMode)
  });
  const artifactsQuery = useQuery({
    queryKey: ['run-artifacts', runId, demoMode],
    queryFn: () => getRunArtifacts(runId, demoMode)
  });
  const messagesQuery = useQuery({
    queryKey: ['run-messages', runId, demoMode],
    queryFn: () => getRunMessages(runId, demoMode)
  });

  const live = useLiveRun({
    runId,
    demoMode,
    initialState: stateQuery.data,
    initialEvents: eventsQuery.data,
    autoStart: liveMode
  });

  const effectiveState = liveMode ? (live.state ?? stateQuery.data) : stateQuery.data;
  const effectiveEvents = liveMode
    ? live.events.length
      ? live.events
      : (eventsQuery.data ?? [])
    : (eventsQuery.data ?? []);
  const connectionStatus = liveMode ? live.connectionStatus : 'ended';

  useEffect(() => {
    if (!effectiveState) return;
    if (selectedNodeId && effectiveState.graph.nodes.some((node) => node.id === selectedNodeId)) return;
    const activeNode = effectiveState.graph.nodes.find((node) => node.status === 'active');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- selecting initial/active node from graph state
    setSelectedNodeId(activeNode?.id ?? effectiveState.graph.nodes[0]?.id);
  }, [effectiveState, selectedNodeId]);

  useEffect(() => {
    if (!autoFollow || !effectiveState) return;
    const activeNode = effectiveState.graph.nodes.find((node) => node.status === 'active');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-follow active node
    if (activeNode) setSelectedNodeId(activeNode.id);
  }, [autoFollow, effectiveState]);

  const cancelMutation = useMutation({
    mutationFn: () => cancelRun(runId, demoMode),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['run', runId] }),
        queryClient.invalidateQueries({ queryKey: ['run-state', runId] })
      ]);
    }
  });

  const replayMutation = useMutation({
    mutationFn: () => createReplay(runId, demoMode),
    onSuccess: (data) => setReplayDescriptorJson(data as unknown as Record<string, unknown>)
  });

  const isLoading = runQuery.isLoading || stateQuery.isLoading;
  const isError = runQuery.error || stateQuery.error;

  const observabilitySummary = useMemo(() => {
    if (!metricsQuery.data || !tracesQuery.data) return [];
    return [
      { label: 'Event count', value: String(metricsQuery.data.eventCount) },
      { label: 'Tool calls', value: String(metricsQuery.data.toolCallCount) },
      { label: 'Signals', value: String(metricsQuery.data.signalCount) },
      { label: 'Trace spans', value: String(tracesQuery.data.spanCount) }
    ];
  }, [metricsQuery.data, tracesQuery.data]);

  const replayFrames = useMemo(() => (liveMode ? [] : getMockFrames(runId)), [liveMode, runId]);
  const replayFrameQuery = useQuery({
    queryKey: ['replay-frame', runId, replaySeq, demoMode],
    queryFn: () => getTimelineFrame(runId, replaySeq as number, demoMode),
    enabled: replaySeq !== undefined
  });

  const compareHref = `/runs/${runId}/compare/${getQuickCompareTarget(runId)}`;

  if (isLoading)
    return (
      <LoadingPanel
        title="Loading run workbench"
        description="Fetching run state, events, metrics, and linked artifacts."
      />
    );
  if (isError || !runQuery.data || !effectiveState) {
    return (
      <ErrorPanel
        message={String(runQuery.error ?? stateQuery.error ?? 'Run data is unavailable.')}
        actionHref="/runs"
        actionLabel="Open run history"
      />
    );
  }

  const replayState = !liveMode && replaySeq !== undefined ? replayFrameQuery.data : undefined;
  const projectedState = replayState ?? effectiveState;
  const projectedEvents =
    !liveMode && replaySeq !== undefined ? effectiveEvents.filter((event) => event.seq <= replaySeq) : effectiveEvents;

  const run = runQuery.data;
  const runtimeDurationMs = metricsQuery.data?.durationMs ?? getRunDurationMs(run);

  return (
    <div className="stack">
      <RunOverviewCard
        run={run}
        connectionStatus={connectionStatus}
        reconnectAttempt={liveMode ? live.reconnectAttempt : undefined}
        onCancel={run.status === 'running' ? () => cancelMutation.mutate() : undefined}
        onReplay={() => replayMutation.mutate()}
        compareHref={compareHref}
      />

      <Card>
        <CardHeader>
          <CardTitle>Execution graph and live orchestration view</CardTitle>
          <CardDescription>
            Graph view of runtime flow, context gathering, specialist agents, aggregation, and final emission.
          </CardDescription>
        </CardHeader>
        <CardContent className="stack">
          <div className="section-actions">
            {liveMode ? (
              <Button variant="secondary" onClick={() => live.setPaused(!live.paused)}>
                {live.paused ? <Play size={16} /> : <Pause size={16} />}
                {live.paused ? 'Resume live stream' : 'Pause live stream'}
              </Button>
            ) : null}
            <label className="switch-row">
              <input type="checkbox" checked={autoFollow} onChange={(event) => setAutoFollow(event.target.checked)} />
              <span>Auto-follow active node</span>
            </label>
            <label className="switch-row">
              <input
                type="checkbox"
                checked={showCriticalPath}
                onChange={(event) => setShowCriticalPath(event.target.checked)}
              />
              <span>Animate critical path</span>
            </label>
            <label className="switch-row">
              <input
                type="checkbox"
                checked={showParallelBranches}
                onChange={(event) => setShowParallelBranches(event.target.checked)}
              />
              <span>Show parallel branches</span>
            </label>
            <Badge label={`latest-seq:${projectedState.timeline.latestSeq}`} tone="info" />
          </div>
          <ErrorBoundary>
            <ExecutionGraph
              state={projectedState}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              showCriticalPath={showCriticalPath}
              showParallelBranches={showParallelBranches}
            />
          </ErrorBoundary>
        </CardContent>
      </Card>

      <div className="triple-layout">
        <ErrorBoundary>
          <NodeInspector
            state={projectedState}
            events={projectedEvents}
            selectedNodeId={selectedNodeId}
            metrics={metricsQuery.data}
            traceSummary={tracesQuery.data}
            artifacts={artifactsQuery.data}
            messages={messagesQuery.data}
          />
        </ErrorBoundary>
        <ErrorBoundary>
          <LiveEventFeed events={projectedEvents} title={liveMode ? 'Live event rail' : 'Canonical event history'} />
        </ErrorBoundary>
        <SignalRail state={projectedState} />
      </div>

      <div className="split-layout">
        <div className="panel-stack">
          <DecisionPanel run={run} state={projectedState} />
          <Card>
            <CardHeader>
              <CardTitle>Run observability summary</CardTitle>
              <CardDescription>
                Aggregate runtime telemetry, session lifecycle, and linked trace coverage for this run.
              </CardDescription>
            </CardHeader>
            <CardContent className="stack">
              <div className="metric-strip">
                {observabilitySummary.map((item) => (
                  <div key={item.label} className="metric-box">
                    <div className="muted small">{item.label}</div>
                    <div className="metric-box-value">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="list-item">
                <div className="list-item-title">Runtime session</div>
                <div className="list-item-meta">
                  {projectedState.run.runtimeSessionId ?? '—'} · started{' '}
                  {formatDateTime(run.startedAt ?? run.createdAt)} · elapsed {formatRelativeDuration(runtimeDurationMs)}
                </div>
              </div>
              <JsonViewer value={{ metrics: metricsQuery.data, traces: tracesQuery.data }} />
            </CardContent>
          </Card>
        </div>

        <div className="panel-stack">
          {!liveMode && replayFrames.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Replay preview</CardTitle>
                <CardDescription>
                  Step through captured frame snapshots and watch the workbench rewind to earlier states.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TimelineScrubber frames={replayFrames} currentSeq={replaySeq} onSeqChange={setReplaySeq} />
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>Artifacts and messages</CardTitle>
              <CardDescription>
                Trace bundles, decision reports, and outbound MACP messages linked to this run.
              </CardDescription>
            </CardHeader>
            <CardContent className="stack">
              <div className="code-grid">
                <JsonViewer value={{ artifacts: artifactsQuery.data ?? [] }} />
                <JsonViewer value={{ messages: messagesQuery.data ?? [] }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Replay and diagnostics</CardTitle>
              <CardDescription>
                Request a replay descriptor from the control plane and inspect generated stream metadata.
              </CardDescription>
            </CardHeader>
            <CardContent className="stack">
              <div className="section-actions">
                <Button variant="secondary" onClick={() => replayMutation.mutate()} disabled={replayMutation.isPending}>
                  <RefreshCw size={16} />
                  {replayMutation.isPending ? 'Preparing replay...' : 'Request replay descriptor'}
                </Button>
                <Link href="/runs" className="button button-ghost">
                  Open run history
                </Link>
              </div>
              {replayDescriptorJson ? (
                <JsonViewer value={replayDescriptorJson} />
              ) : (
                <div className="empty-state compact">
                  <h4>No replay requested yet</h4>
                  <p>Generate a replay descriptor to inspect stream URLs and time-window controls.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
