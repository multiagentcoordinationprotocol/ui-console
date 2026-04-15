import { describe, it, expect } from 'vitest';
import { histogramQuantile, metricSummaryValue, parsePrometheusText } from './prometheus';

const SAMPLE = `
# HELP macp_runs_total Total runs processed by the control plane
# TYPE macp_runs_total counter
macp_runs_total{status="completed"} 1284
macp_runs_total{status="failed"} 42
macp_runs_total{status="cancelled"} 7

# HELP macp_active_runs Currently active runs
# TYPE macp_active_runs gauge
macp_active_runs 3

# HELP macp_run_duration_seconds Run duration in seconds
# TYPE macp_run_duration_seconds histogram
macp_run_duration_seconds_bucket{le="0.5"} 100
macp_run_duration_seconds_bucket{le="1"} 250
macp_run_duration_seconds_bucket{le="2"} 400
macp_run_duration_seconds_bucket{le="5"} 480
macp_run_duration_seconds_bucket{le="+Inf"} 500
macp_run_duration_seconds_sum 620.3
macp_run_duration_seconds_count 500

# HELP http_requests Pool of inbound requests
# TYPE http_requests summary
http_requests{quantile="0.5"} 120
http_requests{quantile="0.99"} 240
http_requests_sum 1234
http_requests_count 42
`;

describe('parsePrometheusText', () => {
  it('parses counter with multiple labeled series', () => {
    const metrics = parsePrometheusText(SAMPLE);
    const counter = metrics.find((m) => m.name === 'macp_runs_total');
    expect(counter).toBeDefined();
    expect(counter!.type).toBe('counter');
    expect(counter!.help).toBe('Total runs processed by the control plane');
    expect(counter!.series).toHaveLength(3);
    expect(counter!.series.find((s) => s.labels.status === 'completed')?.value).toBe(1284);
  });

  it('parses gauge without labels', () => {
    const metrics = parsePrometheusText(SAMPLE);
    const gauge = metrics.find((m) => m.name === 'macp_active_runs');
    expect(gauge?.type).toBe('gauge');
    expect(gauge?.series).toHaveLength(1);
    expect(gauge?.series[0].value).toBe(3);
  });

  it('groups histogram buckets/sum/count under the base metric name', () => {
    const metrics = parsePrometheusText(SAMPLE);
    const h = metrics.find((m) => m.name === 'macp_run_duration_seconds');
    expect(h?.type).toBe('histogram');
    const suffixes = h!.series.map((s) => s.labels.__suffix);
    expect(suffixes.filter((s) => s === '_bucket').length).toBe(5);
    expect(suffixes).toContain('_sum');
    expect(suffixes).toContain('_count');
  });

  it('groups summary quantiles/sum/count under the base name', () => {
    const metrics = parsePrometheusText(SAMPLE);
    const s = metrics.find((m) => m.name === 'http_requests');
    expect(s?.type).toBe('summary');
    const count = s?.series.find((x) => x.labels.__suffix === '_count');
    expect(count?.value).toBe(42);
  });

  it('handles labels containing escaped quotes', () => {
    const metrics = parsePrometheusText(`# TYPE weird gauge\nweird{label="with \\"quotes\\""} 1`);
    expect(metrics[0].series[0].labels.label).toBe('with "quotes"');
  });

  it('ignores blank lines and unknown comment directives', () => {
    const metrics = parsePrometheusText(`\n# fooBar something\n# TYPE x gauge\nx 1\n\n\n`);
    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe('x');
  });

  it('gracefully handles malformed value lines', () => {
    const metrics = parsePrometheusText(`# TYPE x gauge\nx notanumber`);
    expect(metrics).toHaveLength(0);
  });
});

describe('metricSummaryValue', () => {
  it('returns the single value for gauges/counters with one series', () => {
    const metrics = parsePrometheusText(`# TYPE x gauge\nx 42`);
    expect(metricSummaryValue(metrics[0])).toBe(42);
  });

  it('sums the values when a counter has multiple labeled series', () => {
    const metrics = parsePrometheusText(SAMPLE);
    const counter = metrics.find((m) => m.name === 'macp_runs_total')!;
    expect(metricSummaryValue(counter)).toBe(1284 + 42 + 7);
  });

  it('returns the _count series value for histograms', () => {
    const metrics = parsePrometheusText(SAMPLE);
    const h = metrics.find((m) => m.name === 'macp_run_duration_seconds')!;
    expect(metricSummaryValue(h)).toBe(500);
  });
});

describe('histogramQuantile', () => {
  it('computes p50 within the bucket covering target count', () => {
    const metrics = parsePrometheusText(SAMPLE);
    const h = metrics.find((m) => m.name === 'macp_run_duration_seconds')!;
    // total = 500, p50 target = 250 observations. That exactly hits the le=1 bucket.
    expect(histogramQuantile(h, 0.5)).toBe(1);
  });

  it('interpolates linearly inside a bucket', () => {
    const metrics = parsePrometheusText(SAMPLE);
    const h = metrics.find((m) => m.name === 'macp_run_duration_seconds')!;
    // p95 target = 475. Bucket le=2 has cumulative 400, le=5 has 480.
    // fraction = (475 - 400) / (480 - 400) = 0.9375, so interpolated = 2 + 0.9375*(5-2) = 4.8125
    const p95 = histogramQuantile(h, 0.95);
    expect(p95).toBeCloseTo(4.8125, 4);
  });

  it('returns null for non-histograms', () => {
    const metrics = parsePrometheusText(SAMPLE);
    const counter = metrics.find((m) => m.name === 'macp_runs_total')!;
    expect(histogramQuantile(counter, 0.5)).toBeNull();
  });
});
