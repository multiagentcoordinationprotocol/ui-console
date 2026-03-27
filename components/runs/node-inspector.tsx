'use client';

import { useMemo } from 'react';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { JsonViewer } from '@/components/ui/json-viewer';
import { Tabs } from '@/components/ui/tabs';
import type { Artifact, CanonicalEvent, MetricsSummary, RunStateProjection, TraceSummary } from '@/lib/types';
import { formatDateTime, formatPercent, titleCase } from '@/lib/utils/format';

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
  artifacts,
  messages
}: {
  state: RunStateProjection;
  events: CanonicalEvent[];
  selectedNodeId?: string;
  metrics?: MetricsSummary;
  traceSummary?: TraceSummary;
  artifacts?: Artifact[];
  messages?: Record<string, unknown>[];
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

  const relevantMessages = useMemo(() => {
    if (!selectedNode) return [];
    return (messages ?? []).filter((message) => {
      const from = String(message.from ?? '');
      const recipients = Array.isArray(message.to) ? message.to.map(String) : [];
      return from === selectedNode.id || recipients.includes(selectedNode.id);
    });
  }, [messages, selectedNode]);

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
                      latestDecision,
                      outboundMessages: relevantMessages
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
                      decision: latestDecision,
                      messages: relevantMessages
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
                          seq {event.seq} · {formatDateTime(event.ts)} · {event.source.name}
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
            }
          ]}
        />
      </CardContent>
    </Card>
  );
}
