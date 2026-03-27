import Link from 'next/link';
import { StatusBadge } from '@/components/ui/badge';
import type { RunRecord } from '@/lib/types';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils/format';
import { getQuickCompareTarget } from '@/lib/api/client';

export function RunsTable({ runs, showCompare = true }: { runs: RunRecord[]; showCompare?: boolean }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Run</th>
            <th>Status</th>
            <th>Scenario</th>
            <th>Started</th>
            <th>Tokens</th>
            <th>Cost</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id}>
              <td>
                <div>{run.id.slice(0, 8)}</div>
                <div className="muted small">{String(run.metadata?.environment ?? 'unknown')}</div>
              </td>
              <td>
                <StatusBadge status={run.status} />
              </td>
              <td>{String(run.metadata?.scenarioRef ?? run.source?.ref ?? '—')}</td>
              <td>{formatDateTime(run.startedAt ?? run.createdAt)}</td>
              <td>{formatNumber(Number(run.metadata?.totalTokens ?? 0))}</td>
              <td>{formatCurrency(Number(run.metadata?.estimatedCostUsd ?? 0))}</td>
              <td>
                <div className="section-actions">
                  {run.status === 'running' ? (
                    <Link href={`/runs/live/${run.id}`} className="button button-secondary">
                      Watch
                    </Link>
                  ) : (
                    <Link href={`/runs/${run.id}`} className="button button-secondary">
                      Open
                    </Link>
                  )}
                  {showCompare ? (
                    <Link
                      href={`/runs/${run.id}/compare/${getQuickCompareTarget(run.id)}`}
                      className="button button-ghost"
                    >
                      Compare
                    </Link>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
