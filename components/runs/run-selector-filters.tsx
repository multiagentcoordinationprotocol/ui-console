'use client';

import { useMemo } from 'react';
import { Select } from '@/components/ui/field';
import type { RunRecord, RunStatus } from '@/lib/types';

/**
 * PR-A3 — Shared filter bar for `/logs`, `/traces`, and `/observability`.
 *
 * Q24 decision: build once, use three times. The component is a
 * controlled form — callers own the state (usually URL-backed) and
 * hand it in via props.
 *
 * Which filters actually render is prop-driven. `/observability`
 * intentionally does NOT expose a runId filter (Q35 — single-run data
 * belongs on `/runs/[id]`).
 */

export type TimeWindow = 'all' | '15m' | '1h' | '6h' | '24h' | '7d' | '30d';

const RUN_STATUSES: RunStatus[] = [
  'queued',
  'starting',
  'binding_session',
  'running',
  'completed',
  'failed',
  'cancelled'
];

export interface RunSelectorFiltersValue {
  scenario?: string;
  runId?: string;
  status?: RunStatus | 'all';
  environment?: string;
  window?: TimeWindow;
}

export interface RunSelectorFiltersProps {
  value: RunSelectorFiltersValue;
  onChange(next: RunSelectorFiltersValue): void;
  /** Runs to drive the scenario + runId dropdowns. Dedup happens internally. */
  runs?: RunRecord[];
  /** Which controls to render. Each defaults to false. */
  showScenario?: boolean;
  showRunId?: boolean;
  showStatus?: boolean;
  showEnvironment?: boolean;
  showWindow?: boolean;
}

export function RunSelectorFilters({
  value,
  onChange,
  runs = [],
  showScenario = false,
  showRunId = false,
  showStatus = false,
  showEnvironment = false,
  showWindow = false
}: RunSelectorFiltersProps) {
  const scenarioOptions = useMemo(() => {
    const set = new Set<string>();
    for (const run of runs) {
      const ref = run.source?.ref ?? (run.metadata?.scenarioRef as string | undefined);
      if (ref) set.add(ref);
    }
    return Array.from(set).sort();
  }, [runs]);

  const environmentOptions = useMemo(() => {
    const set = new Set<string>();
    for (const run of runs) {
      const env = run.metadata?.environment;
      if (typeof env === 'string') set.add(env);
    }
    return Array.from(set).sort();
  }, [runs]);

  return (
    <div className="grid-4" style={{ gap: 12 }}>
      {showScenario ? (
        <div>
          <label className="field-label">Scenario</label>
          <Select
            value={value.scenario ?? ''}
            onChange={(event) => onChange({ ...value, scenario: event.target.value || undefined })}
          >
            <option value="">All scenarios</option>
            {scenarioOptions.map((ref) => (
              <option key={ref} value={ref}>
                {ref}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      {showRunId ? (
        <div>
          <label className="field-label">Run</label>
          <Select
            value={value.runId ?? ''}
            onChange={(event) => onChange({ ...value, runId: event.target.value || undefined })}
          >
            <option value="">All runs</option>
            {runs.map((run) => {
              const ref = run.source?.ref ?? (run.metadata?.scenarioRef as string | undefined) ?? '';
              return (
                <option key={run.id} value={run.id}>
                  {ref ? `${ref} · ` : ''}
                  {run.id.slice(0, 8)}…
                </option>
              );
            })}
          </Select>
        </div>
      ) : null}

      {showStatus ? (
        <div>
          <label className="field-label">Status</label>
          <Select
            value={value.status ?? 'all'}
            onChange={(event) =>
              onChange({
                ...value,
                status: event.target.value === 'all' ? undefined : (event.target.value as RunStatus)
              })
            }
          >
            <option value="all">All statuses</option>
            {RUN_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      {showEnvironment ? (
        <div>
          <label className="field-label">Environment</label>
          <Select
            value={value.environment ?? ''}
            onChange={(event) => onChange({ ...value, environment: event.target.value || undefined })}
          >
            <option value="">All environments</option>
            {environmentOptions.map((env) => (
              <option key={env} value={env}>
                {env}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      {showWindow ? (
        <div>
          <label className="field-label">Time window</label>
          <Select
            value={value.window ?? '24h'}
            onChange={(event) => onChange({ ...value, window: event.target.value as TimeWindow })}
          >
            <option value="15m">Last 15m</option>
            <option value="1h">Last 1h</option>
            <option value="6h">Last 6h</option>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7d</option>
            <option value="30d">Last 30d</option>
            <option value="all">All time</option>
          </Select>
        </div>
      ) : null}
    </div>
  );
}
