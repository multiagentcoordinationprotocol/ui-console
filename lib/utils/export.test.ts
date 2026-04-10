import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToCsv, exportToJson, flattenRunForCsv, exportTraceBundle } from './export';
import type { RunRecord, CanonicalEvent, RunStateProjection, Artifact } from '@/lib/types';

let lastBlob: Blob | null = null;
let lastFilename: string = '';
const mockClick = vi.fn();

beforeEach(() => {
  lastBlob = null;
  lastFilename = '';
  mockClick.mockClear();

  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn()
  });

  const mockAnchor = {
    href: '',
    download: '',
    click: mockClick
  };

  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') return mockAnchor as unknown as HTMLElement;
    return document.createElement(tag);
  });

  vi.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => node);
  vi.spyOn(document.body, 'removeChild').mockImplementation((node: Node) => node);

  // Intercept Blob construction to capture it
  const OriginalBlob = globalThis.Blob;
  vi.stubGlobal(
    'Blob',
    class extends OriginalBlob {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        lastBlob = this;
      }
    }
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// Helper to capture the filename from the mock anchor
function captureFilename(): string {
  // The downloadBlob function sets a.download = filename before clicking
  const anchor = (document.createElement as ReturnType<typeof vi.fn>).mock.results.find(
    (r: { type: string; value: unknown }) =>
      r.type === 'return' && (r.value as { download?: string }).download !== undefined
  );
  return anchor ? (anchor.value as { download: string }).download : '';
}

describe('exportToCsv', () => {
  it('exports basic rows with correct headers and data', async () => {
    const rows = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 }
    ];

    exportToCsv(rows, 'test.csv');

    expect(lastBlob).not.toBeNull();
    expect(lastBlob!.type).toBe('text/csv;charset=utf-8;');

    const text = await lastBlob!.text();
    const lines = text.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('name,age');
    expect(lines[1]).toBe('Alice,30');
    expect(lines[2]).toBe('Bob,25');

    expect(mockClick).toHaveBeenCalledOnce();
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });

  it('returns early when rows array is empty', () => {
    exportToCsv([], 'empty.csv');

    expect(lastBlob).toBeNull();
    expect(mockClick).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('quotes fields containing commas', async () => {
    const rows = [{ location: 'San Francisco, CA', code: 'SF' }];

    exportToCsv(rows, 'commas.csv');

    const text = await lastBlob!.text();
    const lines = text.split('\n');
    expect(lines[1]).toBe('"San Francisco, CA",SF');
  });

  it('escapes fields containing double quotes', async () => {
    const rows = [{ phrase: 'She said "hello"', id: '1' }];

    exportToCsv(rows, 'quotes.csv');

    const text = await lastBlob!.text();
    const lines = text.split('\n');
    expect(lines[1]).toBe('"She said ""hello""",1');
  });

  it('quotes fields containing newlines', async () => {
    const rows = [{ note: 'line1\nline2', id: '1' }];

    exportToCsv(rows, 'newlines.csv');

    const text = await lastBlob!.text();
    // The field with newline should be quoted
    expect(text).toContain('"line1\nline2"');
  });

  it('converts null and undefined values to empty strings', async () => {
    const rows = [{ a: null, b: undefined, c: 'ok' }];

    exportToCsv(rows, 'nulls.csv');

    const text = await lastBlob!.text();
    const lines = text.split('\n');
    expect(lines[0]).toBe('a,b,c');
    expect(lines[1]).toBe(',,ok');
  });
});

describe('exportToJson', () => {
  it('exports data as pretty-printed JSON', async () => {
    const data = { key: 'value', nested: { count: 42 } };

    exportToJson(data, 'data.json');

    expect(lastBlob).not.toBeNull();
    expect(lastBlob!.type).toBe('application/json');

    const text = await lastBlob!.text();
    expect(text).toBe(JSON.stringify(data, null, 2));

    expect(mockClick).toHaveBeenCalledOnce();
  });
});

describe('flattenRunForCsv', () => {
  it('flattens a complete run with all metadata', () => {
    const run: RunRecord = {
      id: 'run-001',
      status: 'completed',
      runtimeKind: 'macp',
      createdAt: '2026-01-01T00:00:00Z',
      startedAt: '2026-01-01T00:00:01Z',
      endedAt: '2026-01-01T00:05:00Z',
      source: { kind: 'scenario', ref: 'scenario-alpha' },
      metadata: {
        scenarioRef: 'scenario-ref-1',
        environment: 'production',
        templateId: 'template-42',
        totalTokens: 15000,
        estimatedCostUsd: 0.25,
        durationMs: 300000,
        tags: ['batch', 'priority']
      }
    };

    const result = flattenRunForCsv(run);

    expect(result).toEqual({
      id: 'run-001',
      status: 'completed',
      createdAt: '2026-01-01T00:00:00Z',
      startedAt: '2026-01-01T00:00:01Z',
      endedAt: '2026-01-01T00:05:00Z',
      scenarioRef: 'scenario-ref-1',
      environment: 'production',
      templateId: 'template-42',
      totalTokens: 15000,
      estimatedCostUsd: 0.25,
      durationMs: 300000,
      tags: 'batch;priority'
    });
  });

  it('handles minimal run with missing optional fields', () => {
    const run: RunRecord = {
      id: 'run-002',
      status: 'queued',
      runtimeKind: 'macp',
      createdAt: '2026-02-01T00:00:00Z'
    };

    const result = flattenRunForCsv(run);

    expect(result).toEqual({
      id: 'run-002',
      status: 'queued',
      createdAt: '2026-02-01T00:00:00Z',
      startedAt: '',
      endedAt: '',
      scenarioRef: '',
      environment: '',
      templateId: '',
      totalTokens: '',
      estimatedCostUsd: '',
      durationMs: '',
      tags: ''
    });
  });

  it('joins tags array with semicolons', () => {
    const run: RunRecord = {
      id: 'run-003',
      status: 'running',
      runtimeKind: 'macp',
      createdAt: '2026-03-01T00:00:00Z',
      metadata: {
        tags: ['alpha', 'beta', 'gamma']
      }
    };

    const result = flattenRunForCsv(run);

    expect(result.tags).toBe('alpha;beta;gamma');
  });

  it('falls back to source.ref when metadata.scenarioRef is missing', () => {
    const run: RunRecord = {
      id: 'run-004',
      status: 'completed',
      runtimeKind: 'macp',
      createdAt: '2026-03-01T00:00:00Z',
      source: { kind: 'scenario', ref: 'fallback-ref' }
    };

    const result = flattenRunForCsv(run);

    expect(result.scenarioRef).toBe('fallback-ref');
  });
});

describe('exportTraceBundle', () => {
  it('calls exportToJson with correct structure including runId, state, events, artifacts, and exportedAt', async () => {
    const fixedDate = new Date('2026-04-01T12:00:00Z');
    vi.setSystemTime(fixedDate);

    const runId = 'run-trace-001';

    const events: CanonicalEvent[] = [
      {
        id: 'evt-1',
        runId,
        seq: 1,
        ts: '2026-04-01T12:00:01Z',
        type: 'message.sent',
        source: { kind: 'runtime', name: 'agent-a' },
        data: { content: 'hello' }
      }
    ];

    const state: RunStateProjection = {
      run: { runId, status: 'completed' },
      participants: [],
      graph: { nodes: [], edges: [] },
      decision: {},
      signals: { signals: [] },
      progress: { entries: [] },
      timeline: { latestSeq: 1, totalEvents: 1, recent: [] },
      policy: { policyVersion: 'policy.default', commitmentEvaluations: [] },
      trace: { spanCount: 0, linkedArtifacts: [] },
      outboundMessages: { total: 0, queued: 0, accepted: 0, rejected: 0 }
    };

    const artifacts: Artifact[] = [
      {
        id: 'art-1',
        runId,
        kind: 'trace',
        label: 'Main trace',
        createdAt: '2026-04-01T12:00:02Z'
      }
    ];

    exportTraceBundle(runId, events, state, artifacts, 'trace-bundle.json');

    expect(lastBlob).not.toBeNull();
    expect(lastBlob!.type).toBe('application/json');

    const text = await lastBlob!.text();
    const parsed = JSON.parse(text);

    expect(parsed.runId).toBe(runId);
    expect(parsed.state).toEqual(state);
    expect(parsed.canonicalEvents).toEqual(events);
    expect(parsed.artifacts).toEqual(artifacts);
    expect(parsed.exportedAt).toBe('2026-04-01T12:00:00.000Z');

    vi.useRealTimers();
  });
});
