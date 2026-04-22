/**
 * PR-D3 — Prometheus text exposition format parser.
 *
 * Minimal, dependency-free parser for the Prometheus exposition format
 * (https://prometheus.io/docs/instrumenting/exposition_formats/). Covers
 * the subset emitted by the control plane `/metrics` endpoint: counters,
 * gauges, histograms (with `_bucket` / `_sum` / `_count` suffixes), and
 * summaries.
 *
 * Output is structured (`Metric[]`) so the Observability UI can render a
 * sortable / filterable table instead of the current raw-text dump
 * (finding #9b).
 */

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary' | 'untyped';

export interface MetricSeries {
  labels: Record<string, string>;
  value: number;
  /** Optional scrape timestamp (ms). Prometheus text lines may include one. */
  timestamp?: number;
}

export interface Metric {
  /** Base metric name (without `_bucket`/`_sum`/`_count` suffix for histograms). */
  name: string;
  type: MetricType;
  help?: string;
  unit?: string;
  series: MetricSeries[];
}

/**
 * Parse a Prometheus text exposition string into structured metrics.
 *
 * Histograms: each base name is emitted once, with all `_bucket`,
 * `_sum`, and `_count` series grouped under it. Buckets keep their `le`
 * label so consumers (percentile computation, PR-F6) can filter.
 */
export function parsePrometheusText(text: string): Metric[] {
  const byName = new Map<string, Metric>();
  const helpByName = new Map<string, string>();
  const typeByName = new Map<string, MetricType>();
  const unitByName = new Map<string, string>();

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('# HELP ')) {
      const rest = line.slice('# HELP '.length);
      const sp = rest.indexOf(' ');
      if (sp > 0) helpByName.set(rest.slice(0, sp), rest.slice(sp + 1));
      continue;
    }
    if (line.startsWith('# TYPE ')) {
      const rest = line.slice('# TYPE '.length);
      const sp = rest.indexOf(' ');
      if (sp > 0) {
        const n = rest.slice(0, sp);
        const t = rest
          .slice(sp + 1)
          .trim()
          .toLowerCase() as MetricType;
        typeByName.set(
          n,
          (['counter', 'gauge', 'histogram', 'summary', 'untyped'] as MetricType[]).includes(t) ? t : 'untyped'
        );
      }
      continue;
    }
    if (line.startsWith('# UNIT ')) {
      // OpenMetrics extension — backend plan §5.5 (skipped per plan, but parse
      // defensively so we don't break if it appears in the future).
      const rest = line.slice('# UNIT '.length);
      const sp = rest.indexOf(' ');
      if (sp > 0) unitByName.set(rest.slice(0, sp), rest.slice(sp + 1));
      continue;
    }
    if (line.startsWith('#')) continue;

    const parsed = parseSampleLine(line);
    if (!parsed) continue;

    // Determine the base metric name (strip histogram/summary suffixes).
    const baseName = getBaseName(parsed.name, typeByName);
    let metric = byName.get(baseName);
    if (!metric) {
      metric = {
        name: baseName,
        type: typeByName.get(baseName) ?? 'untyped',
        help: helpByName.get(baseName),
        unit: unitByName.get(baseName),
        series: []
      };
      byName.set(baseName, metric);
    }

    // For histograms / summaries, preserve the suffix as a label so the
    // renderer can distinguish `_bucket` / `_sum` / `_count` entries.
    const labels = { ...parsed.labels };
    if (parsed.name !== baseName) {
      labels.__suffix = parsed.name.slice(baseName.length); // e.g. '_bucket'
    }

    metric.series.push({
      labels,
      value: parsed.value,
      timestamp: parsed.timestamp
    });
  }

  return Array.from(byName.values());
}

interface ParsedSample {
  name: string;
  labels: Record<string, string>;
  value: number;
  timestamp?: number;
}

function getBaseName(sampleName: string, types: Map<string, MetricType>): string {
  for (const suffix of ['_bucket', '_sum', '_count']) {
    if (sampleName.endsWith(suffix)) {
      const base = sampleName.slice(0, -suffix.length);
      const type = types.get(base);
      if (type === 'histogram' || type === 'summary') return base;
    }
  }
  return sampleName;
}

function parseSampleLine(line: string): ParsedSample | null {
  // Format: `<name>{<labels>} <value> [<timestamp>]`
  // Labels block is optional.
  const braceIdx = line.indexOf('{');
  let name: string;
  let labelsStr = '';
  let rest: string;

  if (braceIdx > 0) {
    name = line.slice(0, braceIdx);
    const braceClose = findMatchingBrace(line, braceIdx);
    if (braceClose < 0) return null;
    labelsStr = line.slice(braceIdx + 1, braceClose);
    rest = line.slice(braceClose + 1).trim();
  } else {
    const sp = line.indexOf(' ');
    if (sp < 0) return null;
    name = line.slice(0, sp);
    rest = line.slice(sp + 1).trim();
  }

  const parts = rest.split(/\s+/);
  const value = parseFloat(parts[0]);
  if (!isFinite(value)) return null;
  const timestamp = parts[1] !== undefined ? parseFloat(parts[1]) : undefined;

  return {
    name,
    labels: parseLabels(labelsStr),
    value,
    timestamp: isFinite(timestamp ?? NaN) ? timestamp : undefined
  };
}

function findMatchingBrace(line: string, open: number): number {
  let inString = false;
  let escape = false;
  for (let i = open + 1; i < line.length; i++) {
    const c = line[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === '\\' && inString) {
      escape = true;
      continue;
    }
    if (c === '"') inString = !inString;
    else if (c === '}' && !inString) return i;
  }
  return -1;
}

function parseLabels(labelsStr: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!labelsStr.trim()) return out;
  // Parse `key="value"` pairs allowing escaped quotes inside values.
  let i = 0;
  while (i < labelsStr.length) {
    while (i < labelsStr.length && /[\s,]/.test(labelsStr[i])) i++;
    const eq = labelsStr.indexOf('=', i);
    if (eq < 0) break;
    const key = labelsStr.slice(i, eq).trim();
    if (!key) break;
    // Expect `="..."` — find opening quote after `=`.
    let j = eq + 1;
    while (j < labelsStr.length && labelsStr[j] !== '"') j++;
    if (j >= labelsStr.length) break;
    const start = j + 1;
    let end = start;
    while (end < labelsStr.length) {
      if (labelsStr[end] === '\\') {
        end += 2;
        continue;
      }
      if (labelsStr[end] === '"') break;
      end++;
    }
    const value = labelsStr.slice(start, end).replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
    out[key] = value;
    i = end + 1;
  }
  return out;
}

/**
 * Summary line for a metric, used as the table row value:
 *   - gauge / counter: single series → the value; multiple → series count
 *   - histogram: `_count` series gives total observations
 *   - summary: same as histogram
 */
export function metricSummaryValue(metric: Metric): number | null {
  if (metric.type === 'histogram' || metric.type === 'summary') {
    const countSeries = metric.series.find((s) => s.labels.__suffix === '_count');
    return countSeries ? countSeries.value : null;
  }
  if (metric.series.length === 0) return null;
  if (metric.series.length === 1) return metric.series[0].value;
  return metric.series.reduce((sum, s) => sum + s.value, 0);
}

/**
 * Compute a percentile from a histogram's `_bucket` series.
 * `le` buckets are cumulative; we find the bucket that covers `p` of
 * the total count and interpolate linearly within it (same approach as
 * Grafana's `histogram_quantile`).
 *
 * Returns `null` if the metric isn't a histogram or has no data.
 */
export function histogramQuantile(metric: Metric, p: number): number | null {
  if (metric.type !== 'histogram') return null;
  if (p <= 0 || p > 1) return null;

  const buckets = metric.series
    .filter((s) => s.labels.__suffix === '_bucket' && typeof s.labels.le === 'string')
    .map((s) => ({
      le: s.labels.le === '+Inf' ? Infinity : parseFloat(s.labels.le),
      count: s.value
    }))
    .filter((b) => isFinite(b.le) || b.le === Infinity)
    .sort((a, b) => a.le - b.le);

  if (buckets.length === 0) return null;
  const total = buckets[buckets.length - 1].count;
  if (total === 0) return null;

  const target = p * total;
  let prevLe = 0;
  let prevCount = 0;
  for (const b of buckets) {
    if (b.count >= target) {
      if (b.le === Infinity) return prevLe;
      const bucketSize = b.le - prevLe;
      const bucketObs = b.count - prevCount;
      if (bucketObs === 0) return b.le;
      const fraction = (target - prevCount) / bucketObs;
      return prevLe + fraction * bucketSize;
    }
    prevLe = b.le;
    prevCount = b.count;
  }
  return prevLe;
}
