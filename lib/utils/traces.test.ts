import { describe, it, expect } from 'vitest';
import type { JaegerSpan, JaegerTrace } from '@/lib/api/client';
import { buildSpanTree, findCriticalPath } from './traces';

function span(
  id: string,
  parentId: string | null,
  startTime: number,
  duration: number,
  operationName = `op-${id}`
): JaegerSpan {
  return {
    traceID: 'trace-1',
    spanID: id,
    operationName,
    references: parentId ? [{ refType: 'CHILD_OF', traceID: 'trace-1', spanID: parentId }] : [],
    startTime,
    duration,
    tags: [],
    logs: [],
    processID: 'p1'
  };
}

function trace(spans: JaegerSpan[]): JaegerTrace {
  return {
    traceID: 'trace-1',
    spans,
    processes: { p1: { serviceName: 'svc', tags: [] } }
  };
}

describe('buildSpanTree', () => {
  it('returns empty array for an empty trace', () => {
    expect(buildSpanTree(trace([]))).toEqual([]);
  });

  it('produces parents before children with correct depth', () => {
    const t = trace([
      span('a', null, 100, 1000),
      span('b', 'a', 150, 200),
      span('c', 'a', 400, 300),
      span('d', 'b', 160, 50)
    ]);
    const result = buildSpanTree(t);
    const ids = result.map((n) => n.span.spanID);
    expect(ids).toEqual(['a', 'b', 'd', 'c']);
    const depthMap = Object.fromEntries(result.map((n) => [n.span.spanID, n.depth]));
    expect(depthMap).toEqual({ a: 0, b: 1, d: 2, c: 1 });
  });

  it('orders siblings by startTime', () => {
    const t = trace([span('root', null, 0, 1000), span('later', 'root', 500, 10), span('earlier', 'root', 100, 10)]);
    const result = buildSpanTree(t);
    expect(result.map((n) => n.span.spanID)).toEqual(['root', 'earlier', 'later']);
  });

  it('treats orphans (missing parent) as additional roots', () => {
    const t = trace([span('root', null, 0, 1000), span('orphan', 'missing-parent', 200, 100)]);
    const result = buildSpanTree(t);
    expect(result).toHaveLength(2);
    expect(result.map((n) => n.depth)).toEqual([0, 0]);
  });

  it('counts descendants correctly', () => {
    const t = trace([
      span('a', null, 0, 1000),
      span('b', 'a', 100, 500),
      span('c', 'b', 150, 100),
      span('d', 'a', 700, 100)
    ]);
    const result = buildSpanTree(t);
    const descMap = Object.fromEntries(result.map((n) => [n.span.spanID, n.descendantCount]));
    expect(descMap).toEqual({ a: 3, b: 1, c: 0, d: 0 });
  });
});

describe('findCriticalPath', () => {
  it('returns the longest root-to-leaf chain by cumulative span duration', () => {
    const t = trace([
      span('root', null, 0, 100),
      span('short', 'root', 50, 10),
      span('long', 'root', 50, 500),
      span('long-child', 'long', 100, 400)
    ]);
    const tree = buildSpanTree(t);
    const critical = findCriticalPath(tree);
    expect(critical.has('root')).toBe(true);
    expect(critical.has('long')).toBe(true);
    expect(critical.has('long-child')).toBe(true);
    expect(critical.has('short')).toBe(false);
  });

  it('returns an empty set for an empty tree', () => {
    expect(findCriticalPath([])).toEqual(new Set());
  });
});
