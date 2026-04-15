import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { PrometheusMetricsTable } from './prometheus-metrics-table';
import { parsePrometheusText } from '@/lib/utils/prometheus';
import { ToastProvider } from '@/components/ui/toast';

const TEXT = `
# HELP macp_runs_total Run counter
# TYPE macp_runs_total counter
macp_runs_total{status="completed"} 100
macp_runs_total{status="failed"} 5
# HELP macp_queue_depth Queue gauge
# TYPE macp_queue_depth gauge
macp_queue_depth 3
# HELP macp_run_duration_seconds Run duration
# TYPE macp_run_duration_seconds histogram
macp_run_duration_seconds_bucket{le="1"} 80
macp_run_duration_seconds_bucket{le="+Inf"} 100
macp_run_duration_seconds_count 100
macp_run_duration_seconds_sum 50
`;

function wrap(children: React.ReactNode) {
  return <ToastProvider>{children}</ToastProvider>;
}

describe('PrometheusMetricsTable', () => {
  const metrics = parsePrometheusText(TEXT);

  it('renders a row per metric with type badge and summary value', () => {
    renderWithProviders(wrap(<PrometheusMetricsTable metrics={metrics} />));
    expect(screen.getByText('macp_runs_total')).toBeInTheDocument();
    expect(screen.getByText('macp_queue_depth')).toBeInTheDocument();
    expect(screen.getByText('macp_run_duration_seconds')).toBeInTheDocument();
    // Type badges (titleCased by Badge)
    expect(screen.getAllByText('Counter').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Gauge').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Histogram').length).toBeGreaterThanOrEqual(1);
  });

  it('filters by type chip', async () => {
    const user = userEvent.setup();
    renderWithProviders(wrap(<PrometheusMetricsTable metrics={metrics} />));
    // Counter chip — gauge and histogram rows should disappear from the visible table.
    await user.click(screen.getByRole('button', { name: /^counter/i }));
    // macp_queue_depth (gauge) now hidden
    expect(screen.queryByText('macp_queue_depth')).not.toBeInTheDocument();
    expect(screen.getByText('macp_runs_total')).toBeInTheDocument();
  });

  it('filters by name/help search', async () => {
    const user = userEvent.setup();
    renderWithProviders(wrap(<PrometheusMetricsTable metrics={metrics} />));
    const searchInput = screen.getByPlaceholderText(/Filter by name/i);
    await user.type(searchInput, 'duration');
    expect(screen.getByText('macp_run_duration_seconds')).toBeInTheDocument();
    expect(screen.queryByText('macp_queue_depth')).not.toBeInTheDocument();
  });

  it('renders an empty state when no metrics', () => {
    renderWithProviders(wrap(<PrometheusMetricsTable metrics={[]} />));
    expect(screen.getByText('No metrics parsed')).toBeInTheDocument();
  });
});
