import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * KpiCard — R4.5.
 *
 * Standardized KPI tile used across Dashboard, Observability, run-detail
 * overview. Renders the `.kpi-card` shell (v2 CSS overlay applies the
 * colored top-stripe when `accent` is provided, per mockup KPI pattern).
 *
 * Under legacy design (`data-design=v1`) the shell uses existing
 * `.kpi-card` rules — `accent` has no visual effect.
 *
 * Usage:
 *   <KpiCard label="Total runs" value={formatNumber(42)} meta="Active 3" accent="blue" />
 */
interface KpiCardProps {
  label: string;
  value: ReactNode;
  meta?: ReactNode;
  /** Delta indicator (v2 only): "↑ +12.4%", paired with direction. */
  delta?: ReactNode;
  deltaDirection?: 'up' | 'down' | 'neutral';
  /** v2 top-stripe accent color; ignored by legacy CSS. */
  accent?: 'blue' | 'green' | 'amber' | 'violet';
  className?: string;
}

export function KpiCard({ label, value, meta, delta, deltaDirection, accent, className }: KpiCardProps) {
  return (
    <div className={cn('kpi-card', className)} data-accent={accent}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {meta ? <div className="kpi-meta">{meta}</div> : null}
      {delta ? (
        <div className={cn('kpi-delta', deltaDirection && `kpi-delta-${deltaDirection}`)}>
          {deltaDirection === 'up' ? '↑ ' : deltaDirection === 'down' ? '↓ ' : ''}
          {delta}
        </div>
      ) : null}
    </div>
  );
}
