'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { EventDetailDialog } from '@/components/ui/event-detail-dialog';
import { Input } from '@/components/ui/field';
import type { Metric, MetricType } from '@/lib/utils/prometheus';
import { metricSummaryValue } from '@/lib/utils/prometheus';

/**
 * PR-D3 — sortable, filterable Prometheus metrics table.
 *
 * Replaces the raw `<pre>` dump on `/observability` with a structured
 * view over the parsed exposition output. Click a row to open the
 * per-series breakdown (all labeled series + scrape timestamps) in the
 * shared event-detail dialog.
 */

const TYPE_TONES: Record<MetricType, 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  counter: 'info',
  gauge: 'success',
  histogram: 'warning',
  summary: 'warning',
  untyped: 'neutral'
};

export function PrometheusMetricsTable({ metrics }: { metrics: Metric[] }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | MetricType>('all');
  const [selected, setSelected] = useState<Metric | null>(null);

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return metrics
      .filter((metric) => typeFilter === 'all' || metric.type === typeFilter)
      .filter((metric) =>
        lower ? metric.name.toLowerCase().includes(lower) || (metric.help ?? '').toLowerCase().includes(lower) : true
      );
  }, [metrics, search, typeFilter]);

  const typeCounts = useMemo(() => {
    const counts: Record<MetricType, number> = {
      counter: 0,
      gauge: 0,
      histogram: 0,
      summary: 0,
      untyped: 0
    };
    for (const m of metrics) counts[m.type]++;
    return counts;
  }, [metrics]);

  if (metrics.length === 0) {
    return (
      <div className="empty-state compact">
        <h4>No metrics parsed</h4>
        <p>The `/metrics` endpoint returned no recognizable exposition output.</p>
      </div>
    );
  }

  return (
    <>
      <div className="section-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
        <span className="muted small">
          {metrics.length} metric{metrics.length === 1 ? '' : 's'}
        </span>
        {(['all', 'counter', 'gauge', 'histogram', 'summary'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTypeFilter(option)}
            className={`badge ${typeFilter === option ? 'badge-info' : 'badge-neutral'}`}
            style={{ cursor: 'pointer', border: 'none' }}
            aria-pressed={typeFilter === option}
          >
            {option}
            {option !== 'all' ? ` (${typeCounts[option]})` : ''}
          </button>
        ))}
        <Input
          style={{ minWidth: 220, marginLeft: 'auto' }}
          placeholder="Filter by name or help text..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Name</th>
              <th>Type</th>
              <th>Series</th>
              <th>Value</th>
              <th>Help</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state compact">
                    <h4>No matches</h4>
                    <p>Clear the search or switch type filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((metric) => {
                const summary = metricSummaryValue(metric);
                return (
                  <tr
                    key={metric.name}
                    className="expandable-row"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(metric)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelected(metric);
                      }
                    }}
                    aria-label={`${metric.name} — ${metric.series.length} series`}
                  >
                    <td>
                      <code>{metric.name}</code>
                    </td>
                    <td>
                      <Badge label={metric.type} tone={TYPE_TONES[metric.type]} />
                    </td>
                    <td className="mono">{metric.series.length}</td>
                    <td className="mono">
                      {summary !== null ? summary.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
                    </td>
                    <td className="muted small" style={{ maxWidth: 360 }}>
                      {metric.help ?? ''}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <EventDetailDialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? 'Metric'}
        subtitle={selected ? `${selected.type} · ${selected.series.length} series` : undefined}
        meta={
          selected
            ? [
                { label: 'Help', value: selected.help ?? '—' },
                ...(selected.unit ? [{ label: 'Unit', value: selected.unit }] : [])
              ]
            : []
        }
        payload={selected?.series ?? []}
      />
    </>
  );
}
