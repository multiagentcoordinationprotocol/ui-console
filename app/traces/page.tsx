'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { JsonViewer } from '@/components/ui/json-viewer';
import { Select } from '@/components/ui/field';
import { LoadingPanel, ErrorPanel } from '@/components/ui/state-panels';
import { getRunTraces, getTraceData, listRuns } from '@/lib/api/client';
import { usePreferencesStore } from '@/lib/stores/preferences-store';
import { formatDateTime } from '@/lib/utils/format';

export default function TracesPage() {
  const demoMode = usePreferencesStore((state) => state.demoMode);
  const [runId, setRunId] = useState('');
  const runsQuery = useQuery({ queryKey: ['trace-runs', demoMode], queryFn: () => listRuns(demoMode) });
  const effectiveRunId = runId || runsQuery.data?.[0]?.id || '';

  const tracesQuery = useQuery({
    queryKey: ['trace-summary', effectiveRunId, demoMode],
    queryFn: () => getRunTraces(effectiveRunId, demoMode),
    enabled: Boolean(effectiveRunId)
  });
  const artifactsQuery = useQuery({
    queryKey: ['trace-artifacts', effectiveRunId, demoMode],
    queryFn: () => getTraceData(demoMode, effectiveRunId),
    enabled: Boolean(effectiveRunId)
  });

  const spanRows = useMemo(() => {
    return (artifactsQuery.data ?? []).flatMap((artifact) =>
      Array.isArray((artifact.inline as { spans?: unknown[] } | undefined)?.spans)
        ? ((artifact.inline as { spans: unknown[] }).spans as Array<Record<string, unknown>>).map((span) => ({
            artifact,
            span
          }))
        : []
    );
  }, [artifactsQuery.data]);

  if (runsQuery.isLoading || tracesQuery.isLoading || artifactsQuery.isLoading) {
    return (
      <LoadingPanel title="Loading traces" description="Fetching trace summary artifacts and inline span bundles." />
    );
  }
  if (runsQuery.error || tracesQuery.error || artifactsQuery.error || !tracesQuery.data) {
    return (
      <ErrorPanel
        message={String(runsQuery.error ?? tracesQuery.error ?? artifactsQuery.error ?? 'Unable to load traces.')}
        actionHref="/runs"
      />
    );
  }

  return (
    <div className="stack">
      <div className="hero">
        <div>
          <h1>Traces and artifacts</h1>
          <p>
            Inspect trace summaries, inline span bundles, decision reports, and exported artifacts associated with a
            run.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trace scope</CardTitle>
          <CardDescription>Select the run whose trace summary and artifacts you want to inspect.</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="field-label">Run</label>
          <Select value={effectiveRunId} onChange={(event) => setRunId(event.target.value)}>
            {(runsQuery.data ?? []).map((run) => (
              <option key={run.id} value={run.id}>
                {String(run.metadata?.scenarioRef ?? run.source?.ref ?? run.id)}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      <div className="grid-3">
        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-label">Trace ID</div>
            <div className="kpi-value" style={{ fontSize: '1rem' }}>
              {tracesQuery.data.traceId ?? 'n/a'}
            </div>
            <div className="kpi-meta">Primary trace for this run</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-label">Span count</div>
            <div className="kpi-value">{tracesQuery.data.spanCount}</div>
            <div className="kpi-meta">Summarized by the control plane</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-label">Artifacts</div>
            <div className="kpi-value">{(artifactsQuery.data ?? []).length}</div>
            <div className="kpi-meta">Trace bundles and reports</div>
          </CardContent>
        </Card>
      </div>

      <div className="split-layout">
        <Card>
          <CardHeader>
            <CardTitle>Trace summary</CardTitle>
            <CardDescription>
              High-level trace metadata returned by <code>/runs/:id/traces</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JsonViewer value={tracesQuery.data} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Artifacts</CardTitle>
            <CardDescription>Reports, traces, logs, and bundles attached to the run.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="list">
              {(artifactsQuery.data ?? []).map((artifact) => (
                <div key={artifact.id} className="list-item">
                  <div className="list-item-title">{artifact.label}</div>
                  <div className="list-item-meta">
                    {artifact.kind} · {formatDateTime(artifact.createdAt)}
                  </div>
                  <div className="inline-list">
                    <Badge label={artifact.kind} tone="info" />
                    {artifact.uri ? <Badge label="uri" /> : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inline spans</CardTitle>
          <CardDescription>Available only when the artifact payload includes inline span data.</CardDescription>
        </CardHeader>
        <CardContent>
          {spanRows.length === 0 ? (
            <div className="empty-state compact">
              <h4>No inline spans</h4>
              <p>This run has artifacts, but none expose inline span rows in the current payload.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Artifact</th>
                    <th>Span ID</th>
                    <th>Operation</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {spanRows.map(({ artifact, span }, index) => (
                    <tr key={`${artifact.id}-${index}`}>
                      <td>{artifact.label}</td>
                      <td>{String(span.spanId ?? 'n/a')}</td>
                      <td>{String(span.operation ?? 'n/a')}</td>
                      <td>{String(span.durationMs ?? 'n/a')}ms</td>
                      <td>{String(span.status ?? 'unknown')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
