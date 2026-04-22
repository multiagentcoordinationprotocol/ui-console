'use client';

import { useMemo } from 'react';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { JsonViewer } from '@/components/ui/json-viewer';
import { Tabs } from '@/components/ui/tabs';
import type {
  Artifact,
  CanonicalEvent,
  LlmCallCompletedData,
  MetricsSummary,
  RunStateProjection,
  TraceSummary
} from '@/lib/types';
import { formatDateTime, formatNumber, formatPercent, titleCase } from '@/lib/utils/format';

function matchEventToNode(event: CanonicalEvent, nodeId: string) {
  if (event.subject?.id === nodeId) return true;
  if (event.subject?.kind === 'participant' && event.subject.id === nodeId) return true;
  const participantId = String(event.data.participantId ?? event.data.participant ?? '');
  const from = String(event.data.from ?? '');
  const to = Array.isArray(event.data.to) ? event.data.to.map(String) : [];
  return participantId === nodeId || from === nodeId || to.includes(nodeId);
}

export function NodeInspector({
  state,
  events,
  selectedNodeId,
  metrics,
  traceSummary,
  artifacts
}: {
  state: RunStateProjection;
  events: CanonicalEvent[];
  selectedNodeId?: string;
  metrics?: MetricsSummary;
  traceSummary?: TraceSummary;
  artifacts?: Artifact[];
}) {
  const selectedNode = useMemo(
    () => state.graph.nodes.find((node) => node.id === (selectedNodeId ?? state.graph.nodes[0]?.id)),
    [selectedNodeId, state.graph.nodes]
  );

  const participant = useMemo(
    () => state.participants.find((item) => item.participantId === selectedNode?.id),
    [selectedNode?.id, state.participants]
  );

  const relevantEvents = useMemo(
    () =>
      events
        .filter((event) => (selectedNode ? matchEventToNode(event, selectedNode.id) : false))
        .slice(-8)
        .reverse(),
    [events, selectedNode]
  );

  const relevantSignals = useMemo(
    () => state.signals.signals.filter((signal) => signal.sourceParticipantId === selectedNode?.id),
    [selectedNode?.id, state.signals.signals]
  );

  /**
   * Finding #12 / BE §3.3 — LLM call events for this participant.
   * Backend synthesizes `llm.call.completed` from message metadata; we
   * render them here when the selected node is an agent.
   */
  const llmCalls = useMemo(
    () =>
      events
        .filter((event) => event.type === 'llm.call.completed')
        .filter((event) => {
          if (!selectedNode) return false;
          // CP carries the participantId on subject.id; some scenarios
          // also inline it into event.data. Accept either.
          const data = event.data as Partial<LlmCallCompletedData>;
          if (event.subject?.id === selectedNode.id) return true;
          if (data.participantId === selectedNode.id) return true;
          return matchEventToNode(event, selectedNode.id);
        })
        .slice(-20)
        .reverse(),
    [events, selectedNode]
  );

  const relatedArtifacts = useMemo(() => {
    if (!selectedNode) return artifacts ?? [];
    return (artifacts ?? []).filter((artifact) => {
      const inlineText = JSON.stringify(artifact.inline ?? {}).toLowerCase();
      return (
        inlineText.includes(selectedNode.id.toLowerCase()) ||
        artifact.label.toLowerCase().includes(selectedNode.id.toLowerCase())
      );
    });
  }, [artifacts, selectedNode]);

  if (!selectedNode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inspector</CardTitle>
          <CardDescription>Select a node to inspect its payloads, traces, signals, and logs.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const latestEvent = relevantEvents[0];
  const latestProgress = [...state.progress.entries].reverse().find((entry) => entry.participantId === selectedNode.id);
  const latestDecision =
    selectedNode.kind === 'decision' || selectedNode.id === 'decision' ? state.decision.current : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titleCase(selectedNode.id.replace(/-/g, ' '))}</CardTitle>
        <CardDescription>
          Inspect run-state metadata, payloads, emitted signals, trace artifacts, and node-centric logs.
        </CardDescription>
      </CardHeader>
      <CardContent className="stack">
        <div className="inline-list">
          <Badge label={selectedNode.kind} tone="info" />
          <StatusBadge status={selectedNode.status} />
          {participant?.role ? <Badge label={`role:${participant.role}`} /> : null}
          {relevantSignals[0]?.severity ? <Badge label={relevantSignals[0].severity} tone="warning" /> : null}
        </div>

        <div className="metric-strip">
          <div className="metric-box">
            <div className="muted small">Latest activity</div>
            <div className="metric-box-value" style={{ fontSize: '1rem' }}>
              {participant?.latestActivityAt ? formatDateTime(participant.latestActivityAt) : '—'}
            </div>
          </div>
          <div className="metric-box">
            <div className="muted small">Progress</div>
            <div className="metric-box-value">{latestProgress?.percentage ?? 0}%</div>
          </div>
          <div className="metric-box">
            <div className="muted small">Signals</div>
            <div className="metric-box-value">{relevantSignals.length}</div>
          </div>
        </div>

        <Tabs
          defaultValue="overview"
          items={[
            {
              id: 'overview',
              label: 'Overview',
              content: (
                <div className="stack">
                  <div className="list-item">
                    <div className="list-item-title">Node summary</div>
                    <div className="list-item-meta">
                      {participant?.latestSummary ?? latestEvent?.type ?? 'No summary yet.'}
                    </div>
                  </div>
                  <JsonViewer
                    value={{
                      node: selectedNode,
                      participant,
                      latestProgress,
                      latestDecision
                    }}
                  />
                </div>
              )
            },
            {
              id: 'payloads',
              label: 'Payloads',
              content: (
                <div className="stack">
                  <JsonViewer
                    value={{
                      latestEvent: latestEvent?.data ?? {},
                      decision: latestDecision
                    }}
                  />
                </div>
              )
            },
            {
              id: 'signals',
              label: 'Signals',
              content: (
                <div className="signal-list">
                  {relevantSignals.length === 0 ? (
                    <div className="empty-state compact">
                      <h4>No signals</h4>
                      <p>This node has not emitted any side-channel signal yet.</p>
                    </div>
                  ) : (
                    relevantSignals.map((signal) => (
                      <div key={signal.id} className="signal-item">
                        <div>
                          <div className="list-item-title">{signal.name}</div>
                          <div className="list-item-meta">
                            {formatDateTime(signal.ts)} · confidence {formatPercent(signal.confidence ?? 0)}
                          </div>
                        </div>
                        <Badge
                          label={signal.severity ?? 'info'}
                          tone={signal.severity === 'high' ? 'danger' : 'warning'}
                        />
                      </div>
                    ))
                  )}
                </div>
              )
            },
            {
              id: 'logs',
              label: 'Logs',
              content: (
                <div className="timeline-list">
                  {relevantEvents.length === 0 ? (
                    <div className="empty-state compact">
                      <h4>No logs</h4>
                      <p>No canonical events mapped to this node.</p>
                    </div>
                  ) : (
                    relevantEvents.map((event) => (
                      <div key={event.id} className="timeline-item">
                        <div className="list-item-title">{event.type}</div>
                        <div className="list-item-meta">
                          seq {event.seq} · {formatDateTime(event.ts)} · {event.source?.name ?? ''}
                        </div>
                        <JsonViewer value={event.data} />
                      </div>
                    ))
                  )}
                </div>
              )
            },
            {
              id: 'traces',
              label: 'Traces',
              content: (
                <div className="stack">
                  <div className="list-item">
                    <div className="list-item-title">Trace summary</div>
                    <div className="list-item-meta">
                      Span count {traceSummary?.spanCount ?? '—'} · linked artifacts {relatedArtifacts.length}
                    </div>
                  </div>
                  <JsonViewer value={relatedArtifacts} />
                </div>
              )
            },
            {
              id: 'metrics',
              label: 'Metrics',
              content: <JsonViewer value={metrics ?? {}} />
            },
            // Finding #12 — LLM tab, conditionally rendered only when this node
            // has at least one `llm.call.completed` event. BE §3.3 re-scoped:
            // the CP synthesizes the event from message metadata, so no agent
            // changes are required for this tab to populate.
            ...(llmCalls.length > 0
              ? [
                  {
                    id: 'llm',
                    label: `LLM (${llmCalls.length})`,
                    content: (
                      <div className="stack">
                        {llmCalls.map((event) => {
                          const data = event.data as Partial<LlmCallCompletedData>;
                          const model = data.model ?? 'unknown';
                          const promptTokens = data.promptTokens ?? 0;
                          const completionTokens = data.completionTokens ?? 0;
                          const totalTokens = data.totalTokens ?? promptTokens + completionTokens;
                          const latency = data.latencyMs;
                          const provider = data.provider;
                          const cost = data.estimatedCostUsd;
                          const artifactId = data.artifactId;
                          const toText = (value: unknown): string => {
                            if (value == null) return '';
                            if (typeof value === 'string') return value;
                            try {
                              return JSON.stringify(value, null, 2);
                            } catch {
                              return String(value);
                            }
                          };
                          const promptText = toText(data.prompt);
                          const responseText = toText(data.response);
                          return (
                            <details key={event.id} className="list-item" style={{ padding: 'var(--space-md, 12px)' }}>
                              <summary
                                style={{
                                  cursor: 'pointer',
                                  display: 'flex',
                                  gap: 12,
                                  alignItems: 'center',
                                  flexWrap: 'wrap'
                                }}
                              >
                                <code className="mono">{model}</code>
                                {provider ? <Badge label={provider} tone="info" /> : null}
                                <span className="mono muted small">
                                  {formatNumber(promptTokens)} → {formatNumber(completionTokens)} · Σ
                                  {formatNumber(totalTokens)}
                                </span>
                                {typeof latency === 'number' ? (
                                  <span className="mono muted small">{latency}ms</span>
                                ) : null}
                                {typeof cost === 'number' ? (
                                  <span className="mono muted small">${cost.toFixed(4)}</span>
                                ) : null}
                                <span className="muted small" style={{ marginLeft: 'auto' }}>
                                  seq {event.seq} · {formatDateTime(event.ts)}
                                </span>
                              </summary>
                              <div className="stack" style={{ marginTop: 10, gap: 10 }}>
                                {promptText ? (
                                  <div>
                                    <div className="muted small" style={{ marginBottom: 4 }}>
                                      Prompt
                                    </div>
                                    <pre className="json-viewer" style={{ maxHeight: 240, whiteSpace: 'pre-wrap' }}>
                                      {promptText}
                                    </pre>
                                  </div>
                                ) : null}
                                {responseText ? (
                                  <div>
                                    <div className="muted small" style={{ marginBottom: 4 }}>
                                      Response
                                    </div>
                                    <pre className="json-viewer" style={{ maxHeight: 240, whiteSpace: 'pre-wrap' }}>
                                      {responseText}
                                    </pre>
                                  </div>
                                ) : null}
                                {artifactId ? (
                                  <div className="muted small">
                                    Context artifact: <code>{artifactId}</code>
                                  </div>
                                ) : null}
                              </div>
                            </details>
                          );
                        })}
                      </div>
                    )
                  }
                ]
              : [])
          ]}
        />
      </CardContent>
    </Card>
  );
}
