'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, Database, ShieldCheck } from 'lucide-react';
import { LineChartCard } from '@/components/charts/line-chart-card';
import { BarChartCard } from '@/components/charts/bar-chart-card';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { JsonViewer } from '@/components/ui/json-viewer';
import { LoadingPanel, ErrorPanel } from '@/components/ui/state-panels';
import {
  getAuditLogs,
  getDashboardOverview,
  getObservabilityRawMetrics,
  getRuntimeHealth,
  getRuntimeManifest,
  getRuntimeModes,
  getRuntimeRoots
} from '@/lib/api/client';
import { usePreferencesStore } from '@/lib/stores/preferences-store';

export default function ObservabilityPage() {
  const demoMode = usePreferencesStore((state) => state.demoMode);
  const overviewQuery = useQuery({
    queryKey: ['observability-overview', demoMode],
    queryFn: () => getDashboardOverview(demoMode)
  });
  const healthQuery = useQuery({ queryKey: ['runtime-health', demoMode], queryFn: () => getRuntimeHealth(demoMode) });
  const manifestQuery = useQuery({
    queryKey: ['runtime-manifest', demoMode],
    queryFn: () => getRuntimeManifest(demoMode)
  });
  const modesQuery = useQuery({ queryKey: ['runtime-modes', demoMode], queryFn: () => getRuntimeModes(demoMode) });
  const rootsQuery = useQuery({ queryKey: ['runtime-roots', demoMode], queryFn: () => getRuntimeRoots(demoMode) });
  const metricsTextQuery = useQuery({
    queryKey: ['raw-metrics', demoMode],
    queryFn: () => getObservabilityRawMetrics(demoMode)
  });
  const auditQuery = useQuery({ queryKey: ['observability-audit', demoMode], queryFn: () => getAuditLogs(demoMode) });

  if (overviewQuery.isLoading || healthQuery.isLoading) {
    return (
      <LoadingPanel
        title="Loading observability dashboard"
        description="Querying runtime health, audit activity, and metrics snapshots."
      />
    );
  }
  if (overviewQuery.error || healthQuery.error || !overviewQuery.data || !healthQuery.data) {
    return (
      <ErrorPanel
        message={String(overviewQuery.error ?? healthQuery.error ?? 'Observability data is unavailable.')}
        actionHref="/"
      />
    );
  }

  const { charts, kpis } = overviewQuery.data;
  const health = healthQuery.data;

  return (
    <div className="stack">
      <div className="hero">
        <div>
          <h1>Observability</h1>
          <p>
            Monitor runtime health, chart latency and error trends, inspect registered modes, and review raw metrics for
            integration with Prometheus or OTEL pipelines.
          </p>
        </div>
      </div>

      <div className="grid-4">
        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-label">Runtime health</div>
            <div className="kpi-value" style={{ fontSize: '1.4rem' }}>
              {health.ok ? 'Healthy' : 'Degraded'}
            </div>
            <div className="kpi-meta">{health.runtimeKind}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-label">Total runs</div>
            <div className="kpi-value">{kpis.totalRuns}</div>
            <div className="kpi-meta">Active {kpis.activeRuns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-label">Signals</div>
            <div className="kpi-value">{kpis.totalSignals}</div>
            <div className="kpi-meta">Decision-support observations emitted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-label">Registered modes</div>
            <div className="kpi-value">{modesQuery.data?.length ?? 0}</div>
            <div className="kpi-meta">Execution policies and participant models</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid-2">
        <LineChartCard title="Latency over time" data={charts.latency} secondaryKey="secondary" />
        <LineChartCard title="Run and error volume" data={charts.runVolume} secondaryKey="secondary" />
        <BarChartCard title="Error histogram" data={charts.errors} />
        <LineChartCard title="Signal throughput" data={charts.signals} secondaryKey="secondary" />
      </div>

      <div className="split-layout">
        <Card>
          <CardHeader>
            <CardTitle>Runtime identity</CardTitle>
            <CardDescription>
              Manifest, roots, and runtime-specific metadata exposed by the Control Plane.
            </CardDescription>
          </CardHeader>
          <CardContent className="stack">
            <div className="inline-list">
              <StatusBadge status={health.ok ? 'ok' : 'failed'} />
              <Badge label={health.runtimeKind} tone="info" />
              {manifestQuery.data?.supportedModes?.map((mode) => (
                <Badge key={mode} label={mode} />
              ))}
            </div>
            <div className="code-grid">
              <JsonViewer value={manifestQuery.data ?? {}} />
              <JsonViewer value={{ roots: rootsQuery.data ?? [] }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Runtime modes</CardTitle>
            <CardDescription>Mode registry summary from the Control Plane runtime adapter.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="list">
              {(modesQuery.data ?? []).map((mode) => (
                <div key={`${mode.mode}-${mode.modeVersion}`} className="list-item">
                  <div className="list-item-title">{mode.mode}</div>
                  <div className="list-item-meta">
                    {mode.modeVersion} · {mode.participantModel ?? 'unspecified'} · {mode.messageTypes.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid-2">
        <Card>
          <CardHeader>
            <CardTitle style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Database size={18} /> Raw Prometheus metrics
            </CardTitle>
            <CardDescription>
              Useful for validating the shape of exported metrics before wiring dashboards.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="json-viewer">{metricsTextQuery.data ?? ''}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} /> Audit stream
            </CardTitle>
            <CardDescription>Administrative and user actions emitted by the control plane.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="timeline-list">
              {(auditQuery.data?.data ?? []).slice(0, 8).map((entry, index) => (
                <div key={`${entry.action}-${index}`} className="timeline-item">
                  <div className="list-item-title">{entry.action}</div>
                  <div className="list-item-meta">
                    {entry.actor} · {entry.resource}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} /> Health detail
          </CardTitle>
          <CardDescription>
            Root-cause friendly payloads for runtime health troubleshooting and deployment verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JsonViewer value={health} />
        </CardContent>
      </Card>

      {!health.ok ? (
        <div className="empty-state compact">
          <h4 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} /> Runtime is degraded
          </h4>
          <p>
            Inspect the health detail and raw metrics above, then review traces and audit logs for correlated failures.
          </p>
        </div>
      ) : null}
    </div>
  );
}
