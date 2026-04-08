import {
  compareMockRuns,
  computeDashboardKpis,
  COMPLETED_RUN_ID,
  LIVE_RUN_ID,
  MOCK_AGENT_PROFILES,
  MOCK_AUDIT_LOGS,
  MOCK_CHARTS,
  MOCK_COMPILED_RUN,
  MOCK_CREATE_RUN_RESPONSE,
  MOCK_LAUNCH_SCHEMAS,
  MOCK_PACKS,
  MOCK_PROMETHEUS_METRICS,
  MOCK_REPLAY_DESCRIPTORS,
  MOCK_RUN_ARTIFACTS,
  MOCK_RUN_EVENTS,
  MOCK_RUN_FRAMES,
  MOCK_RUN_MESSAGES,
  MOCK_RUN_METRICS,
  MOCK_RUN_STATES,
  MOCK_RUN_TRACES,
  MOCK_RUNS,
  MOCK_RUNTIME_HEALTH,
  MOCK_RUNTIME_MANIFEST,
  MOCK_RUNTIME_MODES,
  MOCK_RUNTIME_ROOTS,
  MOCK_SCENARIOS,
  MOCK_WEBHOOKS
} from '@/lib/data/mock-data';
import type {
  AgentMetricsEntry,
  AgentProfile,
  Artifact,
  AuditListResponse,
  BatchOperationResult,
  CanonicalEvent,
  ChartPoint,
  CircuitBreakerResult,
  CompileLaunchRequest,
  CompileLaunchResult,
  CreateArtifactResult,
  CreateRunResponse,
  DashboardKpis,
  LaunchSchemaResponse,
  MetricsSummary,
  MutationAck,
  PackSummary,
  RebuildProjectionResult,
  ReplayDescriptor,
  RunComparisonResult,
  RunExampleResult,
  RunExportBundle,
  RunRecord,
  RunStateProjection,
  RuntimeHealth,
  RuntimeManifestResult,
  RuntimeModeDescriptor,
  RuntimeRootDescriptor,
  ScenarioSummary,
  SendRunMessageRequest,
  SendSignalRequest,
  TraceSummary,
  ValidateRunResponse,
  WebhookSubscription
} from '@/lib/types';
import { ApiError, fetchJson } from '@/lib/api/fetcher';

function maybeDelay<T>(value: T, ms = 180): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function scenarioSchemaKey(packSlug: string, scenarioSlug: string, version: string, template = 'default') {
  return `${packSlug}/${scenarioSlug}@${version}:${template}`;
}

function listAllScenarios(): ScenarioSummary[] {
  return Object.values(MOCK_SCENARIOS).flatMap((items) => items);
}

function listAllEvents(): CanonicalEvent[] {
  return Object.values(MOCK_RUN_EVENTS).flatMap((items) => items);
}

/** Map flat CP run response to the RunRecord shape the UI expects. */
function normalizeRun(raw: Record<string, unknown>): RunRecord {
  if (!raw.id || typeof raw.id !== 'string') {
    throw new Error(`normalizeRun: missing or invalid 'id' field`);
  }
  if (!raw.status || typeof raw.status !== 'string') {
    throw new Error(`normalizeRun: missing or invalid 'status' field for run ${raw.id}`);
  }
  if (!raw.runtimeKind || typeof raw.runtimeKind !== 'string') {
    throw new Error(`normalizeRun: missing or invalid 'runtimeKind' field for run ${raw.id}`);
  }

  const { sourceKind, sourceRef, ...rest } = raw as unknown as RunRecord & {
    sourceKind?: string;
    sourceRef?: string;
  };
  return {
    ...rest,
    source: rest.source ?? (sourceKind || sourceRef ? { kind: sourceKind, ref: sourceRef } : undefined),
    archivedAt: rest.archivedAt ?? null
  } as RunRecord;
}

export async function listPacks(demoMode: boolean): Promise<PackSummary[]> {
  if (demoMode) return maybeDelay(MOCK_PACKS);
  return fetchJson<PackSummary[]>('example', '/packs');
}

export async function listScenarios(packSlug: string, demoMode: boolean): Promise<ScenarioSummary[]> {
  if (demoMode) return maybeDelay(MOCK_SCENARIOS[packSlug] ?? []);
  return fetchJson<ScenarioSummary[]>('example', `/packs/${packSlug}/scenarios`);
}

export async function getLaunchSchema(
  packSlug: string,
  scenarioSlug: string,
  version: string,
  template: string | undefined,
  demoMode: boolean
): Promise<LaunchSchemaResponse> {
  if (demoMode) {
    const key = scenarioSchemaKey(packSlug, scenarioSlug, version, template ?? 'default');
    const fallbackKey = scenarioSchemaKey(packSlug, scenarioSlug, version, 'default');
    return maybeDelay(MOCK_LAUNCH_SCHEMAS[key] ?? MOCK_LAUNCH_SCHEMAS[fallbackKey]);
  }

  const suffix = template ? `?template=${encodeURIComponent(template)}` : '';
  return fetchJson<LaunchSchemaResponse>(
    'example',
    `/packs/${packSlug}/scenarios/${scenarioSlug}/versions/${version}/launch-schema${suffix}`
  );
}

export async function compileLaunch(input: CompileLaunchRequest, demoMode: boolean): Promise<CompileLaunchResult> {
  if (demoMode) {
    return maybeDelay({
      ...MOCK_COMPILED_RUN,
      display: {
        ...MOCK_COMPILED_RUN.display,
        scenarioRef: input.scenarioRef,
        templateId: input.templateId
      },
      executionRequest: {
        ...MOCK_COMPILED_RUN.executionRequest,
        mode: input.mode ?? 'live',
        session: {
          ...MOCK_COMPILED_RUN.executionRequest.session,
          context: input.inputs
        }
      }
    });
  }

  return fetchJson<CompileLaunchResult>('example', '/launch/compile', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function runExample(
  input: CompileLaunchRequest & { bootstrapAgents?: boolean; submitToControlPlane?: boolean },
  demoMode: boolean
): Promise<RunExampleResult> {
  if (demoMode) {
    return maybeDelay({
      compiled: await compileLaunch(input, true),
      hostedAgents: MOCK_LAUNCH_SCHEMAS['fraud/high-value-new-device@1.0.0:default'].agents.map((agent) => ({
        ...agent,
        participantId: agent.agentRef,
        status: 'bootstrapped'
      })),
      controlPlane: {
        baseUrl: 'http://localhost:3001',
        validated: true,
        submitted: input.submitToControlPlane !== false,
        runId: LIVE_RUN_ID,
        status: 'running',
        traceId: 'trace-live-fraud-001'
      }
    });
  }

  return fetchJson<RunExampleResult>('example', '/examples/run', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function validateRun(body: Record<string, unknown>, demoMode: boolean): Promise<ValidateRunResponse> {
  if (demoMode) {
    return maybeDelay({
      ok: true,
      errors: [],
      warnings: [],
      runtime: { reachable: true, supportedModes: ['negotiation'], capabilities: undefined }
    });
  }
  const raw = await fetchJson<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    runtime: { reachable: boolean; supportedModes: string[]; capabilities?: unknown };
  }>('control-plane', '/runs/validate', {
    method: 'POST',
    body: JSON.stringify(body)
  });
  return {
    ok: raw.valid && raw.errors.length === 0,
    errors: raw.errors,
    warnings: raw.warnings,
    runtime: raw.runtime
  };
}

export async function createRun(body: Record<string, unknown>, demoMode: boolean): Promise<CreateRunResponse> {
  if (demoMode) return maybeDelay(MOCK_CREATE_RUN_RESPONSE);
  return fetchJson<CreateRunResponse>('control-plane', '/runs', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function listRuns(
  demoMode: boolean,
  searchParams?: Record<string, string | number | boolean | undefined>
): Promise<RunRecord[]> {
  if (demoMode) {
    let runs = [...MOCK_RUNS];
    if (searchParams?.status) runs = runs.filter((run) => run.status === searchParams.status);
    return maybeDelay(runs);
  }

  const params: Record<string, string | number | boolean | undefined> = {
    limit: 200,
    offset: 0,
    ...searchParams
  };
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value));
  });
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const res = await fetchJson<{ data: Record<string, unknown>[]; total: number }>('control-plane', `/runs${suffix}`);
  return res.data.map(normalizeRun);
}

export async function getRun(runId: string, demoMode: boolean): Promise<RunRecord> {
  if (demoMode) {
    const run = MOCK_RUNS.find((item) => item.id === runId);
    if (!run) throw new Error(`Unknown mock run: ${runId}`);
    return maybeDelay(run);
  }
  const raw = await fetchJson<Record<string, unknown>>('control-plane', `/runs/${runId}`);
  return normalizeRun(raw);
}

export async function getRunState(runId: string, demoMode: boolean): Promise<RunStateProjection> {
  if (demoMode) {
    const state = MOCK_RUN_STATES[runId];
    if (!state) throw new Error(`Unknown mock run state: ${runId}`);
    return maybeDelay(state);
  }
  return fetchJson<RunStateProjection>('control-plane', `/runs/${runId}/state`);
}

export async function getRunEvents(runId: string, demoMode: boolean, limit = 500): Promise<CanonicalEvent[]> {
  if (demoMode) return maybeDelay(MOCK_RUN_EVENTS[runId] ?? []);
  return fetchJson<CanonicalEvent[]>('control-plane', `/runs/${runId}/events?limit=${limit}`);
}

export async function getRunMetrics(runId: string, demoMode: boolean): Promise<MetricsSummary> {
  if (demoMode) return maybeDelay(MOCK_RUN_METRICS[runId]);
  return fetchJson<MetricsSummary>('control-plane', `/runs/${runId}/metrics`);
}

export async function getRunTraces(runId: string, demoMode: boolean): Promise<TraceSummary> {
  if (demoMode) return maybeDelay(MOCK_RUN_TRACES[runId]);
  return fetchJson<TraceSummary>('control-plane', `/runs/${runId}/traces`);
}

export async function getRunArtifacts(runId: string, demoMode: boolean): Promise<Artifact[]> {
  if (demoMode) return maybeDelay(MOCK_RUN_ARTIFACTS[runId] ?? []);
  return fetchJson<Artifact[]>('control-plane', `/runs/${runId}/artifacts`);
}

export async function getRunMessages(runId: string, demoMode: boolean): Promise<Record<string, unknown>[]> {
  if (demoMode) return maybeDelay(MOCK_RUN_MESSAGES[runId] ?? []);
  return fetchJson<Record<string, unknown>[]>('control-plane', `/runs/${runId}/messages`);
}

export async function cancelRun(
  runId: string,
  demoMode: boolean
): Promise<{ ok: boolean; runId: string; status: string }> {
  if (demoMode) return maybeDelay({ ok: true, runId, status: 'cancelled' });
  const raw = await fetchJson<Record<string, unknown>>('control-plane', `/runs/${runId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason: 'Cancelled from MACP UI' })
  });
  return { ok: true, runId: String(raw.id ?? runId), status: String(raw.status ?? 'cancelled') };
}

export async function cloneRun(
  runId: string,
  demoMode: boolean,
  overrides?: { tags?: string[]; context?: Record<string, unknown> }
): Promise<CreateRunResponse> {
  if (demoMode) return maybeDelay({ runId: LIVE_RUN_ID, status: 'running', traceId: 'trace-live-fraud-001' });
  return fetchJson<CreateRunResponse>('control-plane', `/runs/${runId}/clone`, {
    method: 'POST',
    body: JSON.stringify(overrides ?? {})
  });
}

export async function archiveRun(
  runId: string,
  demoMode: boolean
): Promise<{ ok: boolean; runId: string; archived: boolean }> {
  if (demoMode) return maybeDelay({ ok: true, runId, archived: true });
  const raw = await fetchJson<Record<string, unknown>>('control-plane', `/runs/${runId}/archive`, {
    method: 'POST'
  });
  return { ok: true, runId: String(raw.id ?? runId), archived: true };
}

export async function createReplay(runId: string, demoMode: boolean): Promise<ReplayDescriptor> {
  if (demoMode) return maybeDelay(MOCK_REPLAY_DESCRIPTORS[runId] ?? MOCK_REPLAY_DESCRIPTORS[COMPLETED_RUN_ID]);
  return fetchJson<ReplayDescriptor>('control-plane', `/runs/${runId}/replay`, {
    method: 'POST',
    body: JSON.stringify({ mode: 'timed', speed: 1 })
  });
}

export async function compareRuns(
  leftRunId: string,
  rightRunId: string,
  demoMode: boolean
): Promise<RunComparisonResult> {
  if (demoMode) return maybeDelay(compareMockRuns(leftRunId, rightRunId));
  return fetchJson<RunComparisonResult>('control-plane', '/runs/compare', {
    method: 'POST',
    body: JSON.stringify({ leftRunId, rightRunId })
  });
}

export async function getAgentProfiles(demoMode: boolean): Promise<AgentProfile[]> {
  if (demoMode) return maybeDelay(MOCK_AGENT_PROFILES);
  return fetchJson<AgentProfile[]>('example', '/agents');
}

export async function getAgentProfile(agentRef: string, demoMode: boolean): Promise<AgentProfile | undefined> {
  if (demoMode) {
    const agents = await getAgentProfiles(true);
    return agents.find((agent) => agent.agentRef === agentRef);
  }
  try {
    return await fetchJson<AgentProfile>('example', `/agents/${encodeURIComponent(agentRef)}`);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return undefined;
    throw error;
  }
}

export async function getRuntimeManifest(demoMode: boolean): Promise<RuntimeManifestResult> {
  if (demoMode) return maybeDelay(MOCK_RUNTIME_MANIFEST);
  return fetchJson<RuntimeManifestResult>('control-plane', '/runtime/manifest');
}

export async function getRuntimeModes(demoMode: boolean): Promise<RuntimeModeDescriptor[]> {
  if (demoMode) return maybeDelay(MOCK_RUNTIME_MODES);
  return fetchJson<RuntimeModeDescriptor[]>('control-plane', '/runtime/modes');
}

export async function getRuntimeRoots(demoMode: boolean): Promise<RuntimeRootDescriptor[]> {
  if (demoMode) return maybeDelay(MOCK_RUNTIME_ROOTS);
  return fetchJson<RuntimeRootDescriptor[]>('control-plane', '/runtime/roots');
}

export async function getRuntimeHealth(demoMode: boolean): Promise<RuntimeHealth> {
  if (demoMode) return maybeDelay(MOCK_RUNTIME_HEALTH);
  return fetchJson<RuntimeHealth>('control-plane', '/runtime/health');
}

export async function getAuditLogs(demoMode: boolean, limit = 100, offset = 0): Promise<AuditListResponse> {
  if (demoMode) return maybeDelay({ data: MOCK_AUDIT_LOGS, total: MOCK_AUDIT_LOGS.length });
  return fetchJson<AuditListResponse>('control-plane', `/audit?limit=${limit}&offset=${offset}`);
}

export async function getWebhooks(demoMode: boolean): Promise<WebhookSubscription[]> {
  if (demoMode) return maybeDelay(MOCK_WEBHOOKS);
  return fetchJson<WebhookSubscription[]>('control-plane', '/webhooks');
}

export async function createWebhook(
  body: { url: string; secret: string; events: string[] },
  demoMode: boolean
): Promise<WebhookSubscription> {
  if (demoMode) {
    return maybeDelay({
      id: `webhook-${Date.now()}`,
      url: body.url,
      secret: body.secret,
      events: body.events,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  return fetchJson<WebhookSubscription>('control-plane', '/webhooks', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function deleteWebhook(id: string, demoMode: boolean): Promise<void> {
  if (demoMode) return maybeDelay(undefined as unknown as void);
  await fetchJson('control-plane', `/webhooks/${id}`, { method: 'DELETE' });
}

export async function resetCircuitBreaker(demoMode: boolean): Promise<CircuitBreakerResult> {
  if (demoMode) return maybeDelay({ status: 'ok', state: 'CLOSED' });
  return fetchJson<CircuitBreakerResult>('control-plane', '/admin/circuit-breaker/reset', { method: 'POST' });
}

export async function getDashboardOverview(demoMode: boolean): Promise<{
  kpis: DashboardKpis;
  runs: RunRecord[];
  packs: PackSummary[];
  runtimeHealth: RuntimeHealth;
  charts: Record<string, ChartPoint[]>;
  degraded?: boolean;
}> {
  if (demoMode) {
    return maybeDelay({
      kpis: computeDashboardKpis(),
      runs: MOCK_RUNS,
      packs: MOCK_PACKS,
      runtimeHealth: MOCK_RUNTIME_HEALTH,
      charts: MOCK_CHARTS
    });
  }

  type CpOverview = {
    kpis?: Record<string, number>;
    charts?: Record<string, { labels: string[]; data: number[] }>;
    recentRuns?: Record<string, unknown>[];
    runtimeHealth?: { ok: boolean; runtimeKind: string; detail?: string };
  };
  let overviewDegraded = false;
  const [cpOverview, runs, packs, runtimeHealth] = await Promise.all([
    fetchJson<CpOverview>('control-plane', '/dashboard/overview').catch((error): CpOverview => {
      console.warn(
        '[MACP UI] Dashboard overview endpoint unavailable:',
        error instanceof Error ? error.message : error
      );
      overviewDegraded = true;
      return {};
    }),
    listRuns(false, { limit: 20 }),
    listPacks(false),
    getRuntimeHealth(false)
  ]);

  const cpKpis = cpOverview.kpis ?? {};
  const totalRuns = cpKpis.totalRuns ?? runs.length;
  const activeRuns =
    cpKpis.activeRuns ??
    runs.filter((run) => ['queued', 'starting', 'binding_session', 'running'].includes(run.status)).length;
  const successRate =
    totalRuns === 0 ? 0 : (cpKpis.completedRuns ?? runs.filter((run) => run.status === 'completed').length) / totalRuns;
  const averageDurationMs = cpKpis.avgDurationMs ?? 0;

  const cpCharts = cpOverview.charts ?? {};
  const toChartPoints = (chart?: { labels: string[]; data: number[] }): ChartPoint[] =>
    chart ? chart.labels.map((label, i) => ({ label, value: chart.data[i] ?? 0 })) : [];

  return {
    kpis: {
      totalRuns,
      activeRuns,
      successRate,
      averageDurationMs,
      totalSignals: cpKpis.totalSignals ?? 0,
      totalCostUsd: cpKpis.totalCostUsd ?? cpKpis.estimatedCostUsd ?? 0,
      totalTokens: cpKpis.totalTokens ?? 0
    },
    runs,
    packs,
    runtimeHealth: cpOverview.runtimeHealth
      ? {
          ok: cpOverview.runtimeHealth.ok,
          runtimeKind: cpOverview.runtimeHealth.runtimeKind,
          detail: cpOverview.runtimeHealth.detail
        }
      : runtimeHealth,
    charts: {
      runVolume: toChartPoints(cpCharts.runVolume),
      latency: toChartPoints(cpCharts.latency),
      errors: toChartPoints(cpCharts.errorClasses),
      signals: toChartPoints(cpCharts.signalVolume)
    },
    degraded: overviewDegraded || undefined
  };
}

export async function getLogsData(demoMode: boolean, runId?: string) {
  if (demoMode) {
    const items = runId ? (MOCK_RUN_EVENTS[runId] ?? []) : listAllEvents();
    return maybeDelay(items);
  }
  if (!runId) return [];
  return getRunEvents(runId, false);
}

export async function getTraceData(demoMode: boolean, runId?: string) {
  if (demoMode) {
    if (!runId) return maybeDelay(Object.values(MOCK_RUN_ARTIFACTS).flat());
    return maybeDelay(MOCK_RUN_ARTIFACTS[runId] ?? []);
  }
  if (!runId) return [];
  return getRunArtifacts(runId, false);
}

export async function getObservabilityRawMetrics(demoMode: boolean): Promise<string> {
  if (demoMode) return maybeDelay(MOCK_PROMETHEUS_METRICS);
  const response = await fetch('/api/proxy/control-plane/metrics', { cache: 'no-store' });
  return response.text();
}

export async function getTimelineFrame(
  runId: string,
  seq: number,
  demoMode: boolean
): Promise<RunStateProjection | undefined> {
  if (demoMode) {
    const frames = MOCK_RUN_FRAMES[runId] ?? [];
    return maybeDelay(frames.find((frame) => frame.seq === seq)?.snapshot);
  }
  return fetchJson<RunStateProjection>('control-plane', `/runs/${runId}/replay/state?seq=${seq}`);
}

export function getMockFrames(runId: string) {
  return MOCK_RUN_FRAMES[runId] ?? [];
}

export function getQuickCompareTarget(runId: string): string {
  if (runId === LIVE_RUN_ID) return COMPLETED_RUN_ID;
  return LIVE_RUN_ID;
}

export function listScenarioRefs(): string[] {
  return listAllScenarios().map((scenario) => `${scenario.scenario}@${scenario.versions[0]}`);
}

/* ─── Send Message / Signal into live sessions ─── */

export async function sendRunMessage(
  runId: string,
  body: SendRunMessageRequest,
  demoMode: boolean
): Promise<MutationAck> {
  if (demoMode) return maybeDelay({ ok: true, runId });
  return fetchJson<MutationAck>('control-plane', `/runs/${runId}/messages`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function sendRunSignal(runId: string, body: SendSignalRequest, demoMode: boolean): Promise<MutationAck> {
  if (demoMode) return maybeDelay({ ok: true, runId });
  return fetchJson<MutationAck>('control-plane', `/runs/${runId}/signal`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

/* ─── Batch operations ─── */

export async function batchCancelRuns(runIds: string[], demoMode: boolean): Promise<BatchOperationResult> {
  if (demoMode) return maybeDelay({ results: runIds.map((id) => ({ runId: id, ok: true })) });
  return fetchJson<BatchOperationResult>('control-plane', '/runs/batch/cancel', {
    method: 'POST',
    body: JSON.stringify({ runIds })
  });
}

export async function batchArchiveRuns(runIds: string[], demoMode: boolean): Promise<BatchOperationResult> {
  if (demoMode) return maybeDelay({ results: runIds.map((id) => ({ runId: id, ok: true })) });
  return fetchJson<BatchOperationResult>('control-plane', '/runs/batch/archive', {
    method: 'POST',
    body: JSON.stringify({ runIds })
  });
}

export async function batchDeleteRuns(runIds: string[], demoMode: boolean): Promise<BatchOperationResult> {
  if (demoMode) return maybeDelay({ results: runIds.map((id) => ({ runId: id, ok: true })) });
  return fetchJson<BatchOperationResult>('control-plane', '/runs/batch/delete', {
    method: 'POST',
    body: JSON.stringify({ runIds })
  });
}

/* ─── Run export bundle ─── */

export async function exportRunBundle(runId: string, demoMode: boolean): Promise<RunExportBundle> {
  if (demoMode) {
    const run = MOCK_RUNS.find((r) => r.id === runId) ?? MOCK_RUNS[0];
    return maybeDelay({
      run,
      projection: MOCK_RUN_STATES[runId],
      events: MOCK_RUN_EVENTS[runId] ?? [],
      artifacts: MOCK_RUN_ARTIFACTS[runId] ?? [],
      metrics: MOCK_RUN_METRICS[runId]
    });
  }
  return fetchJson<RunExportBundle>('control-plane', `/runs/${runId}/export`);
}

/* ─── Webhook update ─── */

export async function updateWebhook(
  id: string,
  body: { url?: string; events?: string[]; active?: boolean },
  demoMode: boolean
): Promise<WebhookSubscription> {
  if (demoMode) {
    const existing = MOCK_WEBHOOKS.find((w) => w.id === id);
    return maybeDelay({ ...(existing ?? {}), ...body } as WebhookSubscription);
  }
  return fetchJson<WebhookSubscription>('control-plane', `/webhooks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  });
}

/* ─── Update run context ─── */

export async function updateRunContext(
  runId: string,
  body: { from: string; context: Record<string, unknown> },
  demoMode: boolean
): Promise<MutationAck> {
  if (demoMode) return maybeDelay({ ok: true, runId });
  return fetchJson<MutationAck>('control-plane', `/runs/${runId}/context`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

/* ─── Create artifact ─── */

export async function createArtifact(
  runId: string,
  body: { kind: string; label: string; uri?: string; inline?: Record<string, unknown> },
  demoMode: boolean
): Promise<CreateArtifactResult> {
  if (demoMode) return maybeDelay({ id: 'demo-artifact', runId, ...body, createdAt: new Date().toISOString() });
  return fetchJson<CreateArtifactResult>('control-plane', `/runs/${runId}/artifacts`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

/* ─── Projection rebuild (admin) ─── */

export async function rebuildProjection(runId: string, demoMode: boolean): Promise<RebuildProjectionResult> {
  if (demoMode) return maybeDelay({ rebuilt: true, latestSeq: 42 });
  return fetchJson<RebuildProjectionResult>('control-plane', `/runs/${runId}/projection/rebuild`, { method: 'POST' });
}

/* ─── Readiness probe ─── */

export async function getReadinessProbe(demoMode: boolean) {
  if (demoMode)
    return maybeDelay({
      ok: true,
      checks: { database: 'ok', runtime: 'ok' }
    });
  return fetchJson<{ ok: boolean; checks?: Record<string, string> }>('control-plane', '/readyz');
}

/* ─── Agent metrics from control plane ─── */

/** Shape returned by CP GET /dashboard/agents/metrics */
interface CpAgentMetricsEntry {
  participantId: string;
  runs: number;
  signals: number;
  messages: number;
  averageConfidence: number;
  averageLatencyMs?: number;
}

export async function getAgentMetrics(demoMode: boolean): Promise<AgentMetricsEntry[]> {
  if (demoMode) {
    return maybeDelay(
      MOCK_AGENT_PROFILES.map((agent) => ({
        agentRef: agent.agentRef,
        runs: agent.metrics.runs,
        signals: agent.metrics.signals,
        messages: 0,
        averageLatencyMs: agent.metrics.averageLatencyMs,
        averageConfidence: agent.metrics.averageConfidence
      }))
    );
  }
  try {
    const raw = await fetchJson<CpAgentMetricsEntry[]>('control-plane', '/dashboard/agents/metrics');
    return raw.map((entry) => ({
      agentRef: entry.participantId,
      runs: entry.runs,
      signals: entry.signals,
      messages: entry.messages,
      averageLatencyMs: entry.averageLatencyMs,
      averageConfidence: entry.averageConfidence
    }));
  } catch (error) {
    console.warn('[MACP UI] Agent metrics endpoint unavailable:', error instanceof Error ? error.message : error);
    return [];
  }
}

/* ─── Batch export ─── */

export async function batchExportRuns(runIds: string[], demoMode: boolean): Promise<RunExportBundle[]> {
  if (demoMode) {
    const bundles = runIds.map((id) => {
      const run = MOCK_RUNS.find((r) => r.id === id) ?? MOCK_RUNS[0];
      return {
        run,
        projection: MOCK_RUN_STATES[id],
        events: MOCK_RUN_EVENTS[id] ?? [],
        artifacts: MOCK_RUN_ARTIFACTS[id] ?? [],
        metrics: MOCK_RUN_METRICS[id]
      };
    });
    return maybeDelay(bundles);
  }
  return fetchJson<RunExportBundle[]>('control-plane', '/runs/batch/export', {
    method: 'POST',
    body: JSON.stringify({ runIds })
  });
}

/* ─── Hard delete run ─── */

export async function deleteRun(runId: string, demoMode: boolean): Promise<void> {
  if (demoMode) return maybeDelay(undefined as unknown as void);
  await fetchJson('control-plane', `/runs/${runId}`, { method: 'DELETE' });
}
