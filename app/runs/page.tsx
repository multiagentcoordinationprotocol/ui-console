'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowRightLeft, Clock4, Download, History, Play } from 'lucide-react';
import { RunsTable } from '@/components/runs/runs-table';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/field';
import { SectionHeader } from '@/components/ui/section-header';
import { LoadingPanel, ErrorPanel } from '@/components/ui/state-panels';
import { listRuns } from '@/lib/api/client';
import { usePreferencesStore } from '@/lib/stores/preferences-store';
import { formatCurrency, formatNumber, formatRelativeDuration } from '@/lib/utils/format';
import { exportToCsv, exportToJson, flattenRunForCsv } from '@/lib/utils/export';
import { getRunDurationMs } from '@/lib/utils/macp';

export default function RunHistoryPage() {
  const demoMode = usePreferencesStore((state) => state.demoMode);
  const [status, setStatus] = useState('all');
  const [environment, setEnvironment] = useState('all');
  const [search, setSearch] = useState('');
  const serverParams = useMemo(() => {
    const params: Record<string, string | undefined> = {};
    if (status !== 'all') params.status = status;
    if (environment !== 'all') params.environment = environment;
    if (search.trim()) params.search = search.trim();
    return params;
  }, [environment, search, status]);

  const runsQuery = useQuery({
    queryKey: ['runs', demoMode, serverParams],
    queryFn: () => listRuns(demoMode, serverParams)
  });

  const filteredRuns = useMemo(() => {
    if (!demoMode) return runsQuery.data ?? [];
    const lower = search.toLowerCase();
    return (runsQuery.data ?? []).filter((run) => {
      const matchesStatus = status === 'all' || run.status === status;
      const matchesEnv = environment === 'all' || String(run.metadata?.environment ?? '') === environment;
      const haystack = [run.id, run.metadata?.scenarioRef, run.source?.ref, ...(run.tags ?? [])]
        .join(' ')
        .toLowerCase();
      return matchesStatus && matchesEnv && haystack.includes(lower);
    });
  }, [demoMode, environment, runsQuery.data, search, status]);

  const aggregate = useMemo(() => {
    const totalCost = filteredRuns.reduce((sum, run) => sum + Number(run.metadata?.estimatedCostUsd ?? 0), 0);
    const totalTokens = filteredRuns.reduce((sum, run) => sum + Number(run.metadata?.totalTokens ?? 0), 0);
    const averageDuration = filteredRuns.length
      ? filteredRuns.reduce((sum, run) => sum + getRunDurationMs(run), 0) / filteredRuns.length
      : 0;
    return { totalCost, totalTokens, averageDuration };
  }, [filteredRuns]);

  const environments = useMemo(() => {
    const envs = new Set<string>();
    for (const run of runsQuery.data ?? []) {
      const env = String(run.metadata?.environment ?? '');
      if (env) envs.add(env);
    }
    return Array.from(envs).sort();
  }, [runsQuery.data]);

  if (runsQuery.isLoading)
    return (
      <LoadingPanel
        title="Loading run history"
        description="Fetching historical runs, filters, and analytics aggregates."
      />
    );
  if (runsQuery.error || !runsQuery.data)
    return <ErrorPanel message={String(runsQuery.error ?? 'Run history is unavailable.')} actionHref="/" />;

  return (
    <div className="stack">
      <div className="hero">
        <div>
          <h1>Run history</h1>
          <p>
            Search completed and failed executions, compare outcomes across modes, and reopen any run for detailed
            forensics.
          </p>
        </div>
        <div className="section-actions">
          <Link href="/runs/new" className="button button-primary">
            <Play size={16} />
            New run
          </Link>
          <button
            className="button button-secondary"
            onClick={() => exportToCsv(filteredRuns.map(flattenRunForCsv), 'macp-runs.csv')}
          >
            <Download size={16} />
            Export CSV
          </button>
          <button className="button button-ghost" onClick={() => exportToJson(filteredRuns, 'macp-runs.json')}>
            <Download size={16} />
            Export JSON
          </button>
          <Link href="/runs/live" className="button button-secondary">
            <Clock4 size={16} />
            Live runs
          </Link>
        </div>
      </div>

      <div className="grid-4">
        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-label">Filtered runs</div>
            <div className="kpi-value">{filteredRuns.length}</div>
            <div className="kpi-meta">Based on current search and status filters</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-label">Avg duration</div>
            <div className="kpi-value">{formatRelativeDuration(aggregate.averageDuration)}</div>
            <div className="kpi-meta">Execution time across filtered runs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-label">Tokens</div>
            <div className="kpi-value">{formatNumber(aggregate.totalTokens)}</div>
            <div className="kpi-meta">Prompt + completion usage</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-label">Estimated cost</div>
            <div className="kpi-value">{formatCurrency(aggregate.totalCost)}</div>
            <div className="kpi-meta">Across the filtered sample</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Slice by run status, environment, or search terms embedded in scenario refs and tags.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid-3">
          <div>
            <label className="field-label">Search</label>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="run id, scenario ref, tag..."
            />
          </div>
          <div>
            <label className="field-label">Status</label>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
          <div>
            <label className="field-label">Environment</label>
            <Select value={environment} onChange={(event) => setEnvironment(event.target.value)}>
              <option value="all">All environments</option>
              {environments.map((env) => (
                <option key={env} value={env}>
                  {env}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <SectionHeader
        title="Historical runs"
        description="Open any run to inspect traces, signals, context, and final decisions."
        actions={
          <Link href="/runs/live" className="button button-ghost">
            <History size={16} />
            Open running sessions
          </Link>
        }
      />
      <RunsTable runs={filteredRuns} />

      <div className="grid-2">
        {filteredRuns.slice(0, 2).map((run) => (
          <Card key={run.id}>
            <CardHeader>
              <CardTitle>{String(run.metadata?.scenarioRef ?? run.source?.ref ?? run.id)}</CardTitle>
              <CardDescription>Quick snapshot for compare and replay routing.</CardDescription>
            </CardHeader>
            <CardContent className="stack">
              <div className="inline-list">
                <StatusBadge status={run.status} />
                <Badge label={String(run.metadata?.environment ?? 'unknown')} tone="info" />
              </div>
              <div className="metric-strip">
                <div className="metric-box">
                  <div className="muted small">Duration</div>
                  <div className="metric-box-value">{formatRelativeDuration(getRunDurationMs(run))}</div>
                </div>
                <div className="metric-box">
                  <div className="muted small">Tokens</div>
                  <div className="metric-box-value">{formatNumber(Number(run.metadata?.totalTokens ?? 0))}</div>
                </div>
                <div className="metric-box">
                  <div className="muted small">Action</div>
                  <div className="metric-box-value" style={{ fontSize: '1rem' }}>
                    {String(run.metadata?.finalAction ?? 'pending')}
                  </div>
                </div>
              </div>
              <div className="section-actions">
                <Link href={`/runs/${run.id}`} className="button button-secondary">
                  Open run
                </Link>
                <Link
                  href={`/runs/${run.id}/compare/${filteredRuns.find((candidate) => candidate.id !== run.id)?.id ?? run.id}`}
                  className="button button-ghost"
                >
                  <ArrowRightLeft size={16} />
                  Compare
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
