'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Archive, Download, Trash2, XCircle } from 'lucide-react';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { RunRecord } from '@/lib/types';
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/utils/format';
import {
  getQuickCompareTarget,
  batchCancelRuns,
  batchArchiveRuns,
  batchDeleteRuns,
  batchExportRuns
} from '@/lib/api/client';
import { usePreferencesStore } from '@/lib/stores/preferences-store';

export function RunsTable({ runs, showCompare = true }: { runs: RunRecord[]; showCompare?: boolean }) {
  const demoMode = usePreferencesStore((state) => state.demoMode);
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleOne = useCallback(
    (id: string) =>
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    []
  );

  const toggleAll = useCallback(() => {
    setSelected((prev) => (prev.size === runs.length ? new Set() : new Set(runs.map((r) => r.id))));
  }, [runs]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const onBatchSuccess = useCallback(async () => {
    clearSelection();
    await queryClient.invalidateQueries({ queryKey: ['runs'] });
  }, [clearSelection, queryClient]);

  const cancelMutation = useMutation({
    mutationFn: () => batchCancelRuns([...selected], demoMode),
    onSuccess: onBatchSuccess
  });
  const archiveMutation = useMutation({
    mutationFn: () => batchArchiveRuns([...selected], demoMode),
    onSuccess: onBatchSuccess
  });
  const deleteMutation = useMutation({
    mutationFn: () => batchDeleteRuns([...selected], demoMode),
    onSuccess: onBatchSuccess
  });
  const exportMutation = useMutation({
    mutationFn: async () => {
      const bundles = await batchExportRuns([...selected], demoMode);
      const blob = new Blob([JSON.stringify(bundles, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `macp-runs-batch-${selected.size}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  });

  const hasSelection = selected.size > 0;
  const anyPending =
    cancelMutation.isPending || archiveMutation.isPending || deleteMutation.isPending || exportMutation.isPending;

  return (
    <div className="stack">
      {hasSelection && (
        <div className="batch-toolbar">
          <span className="muted">
            {selected.size} run{selected.size !== 1 ? 's' : ''} selected
          </span>
          <Button variant="secondary" onClick={() => cancelMutation.mutate()} disabled={anyPending}>
            <XCircle size={14} />
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => archiveMutation.mutate()} disabled={anyPending}>
            <Archive size={14} />
            Archive
          </Button>
          <Button variant="secondary" onClick={() => exportMutation.mutate()} disabled={anyPending}>
            <Download size={14} />
            Export
          </Button>
          <Button variant="danger" onClick={() => deleteMutation.mutate()} disabled={anyPending}>
            <Trash2 size={14} />
            Delete
          </Button>
          <Button variant="ghost" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 32 }}>
                <input
                  type="checkbox"
                  checked={selected.size === runs.length && runs.length > 0}
                  onChange={toggleAll}
                />
              </th>
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
              <tr key={run.id} className={selected.has(run.id) ? 'row-selected' : undefined}>
                <td>
                  <input type="checkbox" checked={selected.has(run.id)} onChange={() => toggleOne(run.id)} />
                </td>
                <td>
                  <div>{run.id.slice(0, 8)}</div>
                  <div className="muted small">{String(run.metadata?.environment ?? 'unknown')}</div>
                </td>
                <td>
                  <div className="inline-list" style={{ gap: 4 }}>
                    <StatusBadge status={run.status} />
                    {run.status === 'completed' && typeof run.metadata?.finalAction === 'string' && (
                      <span
                        title={`Outcome: ${run.metadata.finalAction}`}
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor:
                            run.metadata.finalAction === 'decline' ? 'var(--color-danger)' : 'var(--color-success)'
                        }}
                      />
                    )}
                  </div>
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
    </div>
  );
}
