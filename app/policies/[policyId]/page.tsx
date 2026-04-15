'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { JsonViewer } from '@/components/ui/json-viewer';
import { LoadingPanel, ErrorPanel } from '@/components/ui/state-panels';
import { getRuntimePolicy, listRuns } from '@/lib/api/client';
import { usePreferencesStore } from '@/lib/stores/preferences-store';
import { formatDateTime, formatRelativeDuration } from '@/lib/utils/format';
import { getRunDurationMs } from '@/lib/utils/macp';

/**
 * /policies/[policyId] — full runtime policy descriptor view.
 *
 * Implements finding #2 / Q4 (dedicated page) + Q5 (capped "Recent runs
 * using this policy version" cohort).
 */
export default function PolicyDetailPage() {
  const params = useParams<{ policyId: string }>();
  const demoMode = usePreferencesStore((state) => state.demoMode);
  const policyId = decodeURIComponent(params.policyId);

  const policyQuery = useQuery({
    queryKey: ['policy-detail', policyId, demoMode],
    queryFn: () => getRuntimePolicy(policyId, demoMode)
  });

  const cohortQuery = useQuery({
    queryKey: ['policy-cohort', policyId, demoMode],
    queryFn: () => listRuns(demoMode, { search: policyId, limit: 20 })
  });

  if (policyQuery.isLoading) {
    return <LoadingPanel title="Loading policy" description="Fetching runtime policy descriptor." />;
  }

  if (policyQuery.error || !policyQuery.data) {
    return (
      <ErrorPanel
        message={String(policyQuery.error ?? 'Policy not found.')}
        actionHref="/policies"
        actionLabel="Back to policies"
      />
    );
  }

  const policy = policyQuery.data;
  const cohort = cohortQuery.data ?? [];
  const registeredAt = policy.registeredAtUnixMs
    ? formatDateTime(new Date(policy.registeredAtUnixMs).toISOString())
    : null;

  return (
    <div className="stack">
      <div className="hero">
        <div>
          <Link href="/policies" className="button button-ghost" style={{ marginBottom: 12, width: 'fit-content' }}>
            <ArrowLeft size={14} />
            All policies
          </Link>
          <h1 style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={24} />
            <code>{policy.policyId}</code>
          </h1>
          <p>{policy.description || 'No description registered for this policy.'}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy descriptor</CardTitle>
          <CardDescription>Registration metadata and rule payload as persisted by the control plane.</CardDescription>
        </CardHeader>
        <CardContent className="stack">
          <div className="inline-list">
            <Badge label={policy.mode} tone="info" />
            <Badge label={`schema v${policy.schemaVersion}`} />
            {registeredAt ? <Badge label={`registered ${registeredAt}`} /> : null}
          </div>
          <div>
            <div className="muted small" style={{ marginBottom: 6 }}>
              Rules
            </div>
            <JsonViewer value={policy.rules} />
          </div>
        </CardContent>
      </Card>

      {/* Q5 — Recent runs (last 20) cohort. Hide when zero results. */}
      {cohortQuery.isSuccess && cohort.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent runs using this policy version</CardTitle>
            <CardDescription>
              Up to 20 most recent runs. Follow a run to compare outcomes across the cohort.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Run</th>
                    <th>Scenario</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {cohort.map((run) => (
                    <tr key={run.id}>
                      <td>
                        <Link href={`/runs/${run.id}`}>
                          <code>{run.id.slice(0, 8)}</code>
                        </Link>
                      </td>
                      <td>{run.source?.ref ?? String(run.metadata?.scenarioRef ?? '—')}</td>
                      <td>
                        <StatusBadge status={run.status} />
                      </td>
                      <td className="mono">{formatRelativeDuration(getRunDurationMs(run))}</td>
                      <td className="mono muted small">{formatDateTime(run.startedAt ?? run.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12 }}>
              <Link href={`/runs?search=${encodeURIComponent(policyId)}`} className="panel-action">
                See all runs using this policy →
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
