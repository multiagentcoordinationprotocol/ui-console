export type RunStatus = 'queued' | 'starting' | 'binding_session' | 'running' | 'completed' | 'failed' | 'cancelled';

export type ExecutionMode = 'live' | 'replay' | 'sandbox';
export type SessionState =
  | 'SESSION_STATE_UNSPECIFIED'
  | 'SESSION_STATE_OPEN'
  | 'SESSION_STATE_RESOLVED'
  | 'SESSION_STATE_EXPIRED';

/* ─── Policy governance (RFC-MACP-0012) ─── */

export type PolicyType = 'none' | 'majority' | 'supermajority' | 'unanimous' | string;

export interface PolicyHints {
  type?: PolicyType;
  description?: string;
  threshold?: number;
  vetoEnabled?: boolean;
  vetoRoles?: string[];
  vetoThreshold?: number;
  minimumConfidence?: number;
  designatedRoles?: string[];
}

export interface CommitmentEvaluation {
  commitmentId: string;
  decision: 'allow' | 'deny';
  reasons: string[];
  ts: string;
}

export interface PolicyProjection {
  policyVersion?: string;
  policyDescription?: string;
  resolvedAt?: string;
  commitmentEvaluations: CommitmentEvaluation[];
}

export interface PackSummary {
  slug: string;
  name: string;
  description?: string;
  tags?: string[];
}

export interface ScenarioSummary {
  scenario: string;
  name: string;
  summary?: string;
  versions: string[];
  templates: string[];
  tags?: string[];
  runtimeKind?: string;
  agentRefs?: string[];
  policyVersion?: string;
  policyHints?: PolicyHints;
}

export interface LaunchSchemaAgent {
  agentRef: string;
  name: string;
  role: string;
  framework: string;
  description?: string;
  transportIdentity: string;
  entrypoint: string;
  bootstrapStrategy: string;
  bootstrapMode: string;
  tags?: string[];
}

export interface LaunchSchemaResponse {
  scenarioRef: string;
  templateId?: string;
  formSchema: Record<string, unknown>;
  defaults: Record<string, unknown>;
  participants: Array<{
    id: string;
    role: string;
    agentRef: string;
  }>;
  agents: LaunchSchemaAgent[];
  runtime: {
    kind: string;
    version?: string;
  };
  launchSummary: {
    modeName: string;
    modeVersion: string;
    configurationVersion: string;
    policyVersion?: string;
    policyHints?: PolicyHints;
    ttlMs: number;
    initiatorParticipantId?: string;
  };
  expectedDecisionKinds?: string[];
}

export interface CompileLaunchRequest {
  scenarioRef: string;
  templateId?: string;
  mode?: 'live' | 'sandbox';
  inputs: Record<string, unknown>;
}

export interface ParticipantBinding {
  participantId: string;
  role: string;
  agentRef: string;
}

export interface ExecutionRequest {
  mode: ExecutionMode;
  runtime: {
    kind: string;
    version?: string;
  };
  session: {
    modeName: string;
    modeVersion: string;
    configurationVersion: string;
    policyVersion?: string;
    policyHints?: PolicyHints;
    ttlMs: number;
    initiatorParticipantId?: string;
    participants: Array<{
      id: string;
      role?: string;
      transportIdentity?: string;
      metadata?: Record<string, unknown>;
    }>;
    roots?: Array<{ uri: string; name?: string }>;
    context?: Record<string, unknown>;
    contextEnvelope?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };
  kickoff?: Array<{
    from: string;
    to: string[];
    kind: 'request' | 'broadcast' | 'proposal' | 'context';
    messageType: string;
    payload?: Record<string, unknown>;
    payloadEnvelope?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }>;
  execution?: {
    idempotencyKey?: string;
    tags?: string[];
    requester?: {
      actorId?: string;
      actorType?: 'user' | 'service' | 'system';
    };
  };
}

export interface CompileLaunchResult {
  executionRequest: ExecutionRequest;
  display: {
    title: string;
    scenarioRef: string;
    templateId?: string;
    expectedDecisionKinds?: string[];
  };
  participantBindings: ParticipantBinding[];
}

export interface RunRecord {
  id: string;
  status: RunStatus;
  runtimeKind: string;
  runtimeVersion?: string;
  runtimeSessionId?: string;
  traceId?: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  tags?: string[];
  source?: {
    kind?: string;
    ref?: string;
  };
  metadata?: Record<string, unknown>;
  archivedAt?: string | null;
}

export interface CreateRunResponse {
  runId: string;
  status: RunStatus;
  traceId?: string;
}

export interface CanonicalEvent {
  id: string;
  runId: string;
  seq: number;
  ts: string;
  type: string;
  subject?: {
    kind: string;
    id: string;
  };
  source: {
    kind: 'runtime' | 'control-plane' | 'replay';
    name: string;
    rawType?: string;
  };
  trace?: {
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
  };
  data: Record<string, unknown>;
}

export interface Artifact {
  id: string;
  runId: string;
  kind: 'trace' | 'json' | 'report' | 'log' | 'bundle';
  label: string;
  uri?: string;
  inline?: Record<string, unknown>;
  createdAt: string;
}

export interface TraceSummary {
  traceId?: string;
  spanCount: number;
  lastSpanId?: string;
  linkedArtifacts: string[];
}

export interface MetricsSummary {
  runId: string;
  eventCount: number;
  messageCount: number;
  signalCount: number;
  proposalCount: number;
  toolCallCount: number;
  decisionCount: number;
  streamReconnectCount: number;
  firstEventAt?: string;
  lastEventAt?: string;
  durationMs?: number;
  sessionState?: SessionState;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
}

export interface RunStateProjection {
  run: {
    runId: string;
    status: RunStatus;
    runtimeSessionId?: string;
    startedAt?: string;
    endedAt?: string;
    traceId?: string;
    modeName?: string;
  };
  participants: Array<{
    participantId: string;
    role?: string;
    status: 'idle' | 'active' | 'waiting' | 'completed' | 'failed';
    latestActivityAt?: string;
    latestSummary?: string;
  }>;
  graph: {
    nodes: Array<{ id: string; kind: string; status: string }>;
    edges: Array<{ from: string; to: string; kind: string; ts: string }>;
  };
  decision: {
    current?: {
      action: string;
      confidence?: number;
      reasons?: string[];
      finalized: boolean;
      proposalId?: string;
    };
  };
  signals: {
    signals: Array<{
      id: string;
      name: string;
      severity?: string;
      sourceParticipantId?: string;
      ts: string;
      confidence?: number;
      payload?: Record<string, unknown>;
    }>;
  };
  progress: {
    entries: Array<{
      participantId: string;
      percentage?: number;
      message?: string;
      ts: string;
    }>;
  };
  timeline: {
    latestSeq: number;
    totalEvents: number;
    recent: Array<Pick<CanonicalEvent, 'id' | 'seq' | 'ts' | 'type' | 'subject'>>;
  };
  policy?: PolicyProjection;
  trace: TraceSummary;
  outboundMessages: {
    total: number;
    queued: number;
    accepted: number;
    rejected: number;
  };
}

export interface ReplayDescriptor {
  runId: string;
  mode: 'instant' | 'timed' | 'step';
  speed: number;
  fromSeq?: number;
  toSeq?: number;
  streamUrl: string;
  stateUrl: string;
}

export interface RunComparisonResult {
  left: { runId: string; status: RunStatus; modeName?: string; durationMs?: number };
  right: { runId: string; status: RunStatus; modeName?: string; durationMs?: number };
  statusMatch: boolean;
  durationDeltaMs?: number;
  confidenceDelta?: number;
  participantsDiff: {
    added: string[];
    removed: string[];
    common: string[];
  };
  signalsDiff: {
    added: string[];
    removed: string[];
  };
}

export interface RuntimeModeDescriptor {
  mode: string;
  modeVersion: string;
  title?: string;
  description?: string;
  determinismClass?: string;
  participantModel?: string;
  messageTypes: string[];
  terminalMessageTypes: string[];
  schemaUris?: Record<string, string>;
}

export interface RuntimeManifestResult {
  agentId: string;
  title?: string;
  description?: string;
  supportedModes: string[];
  metadata?: Record<string, string>;
}

export interface RuntimeRootDescriptor {
  uri: string;
  name?: string;
}

export interface RuntimeHealth {
  ok: boolean;
  runtimeKind: string;
  detail?: string;
  manifest?: RuntimeManifestResult;
}

export interface AuditEntry {
  id?: string;
  actor: string;
  actorType: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  requestId?: string;
  createdAt: string;
}

export interface AuditListResponse {
  data: AuditEntry[];
  total: number;
}

export interface ValidateRunResponse {
  ok: boolean;
  errors: string[];
  warnings: string[];
  runtime: {
    reachable: boolean;
    supportedModes: string[];
    capabilities?: unknown;
  };
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  deliveryStats?: {
    total: number;
    succeeded: number;
    failed: number;
    lastDeliveredAt?: string;
  };
}

export interface DashboardKpis {
  totalRuns: number;
  activeRuns: number;
  successRate: number;
  averageDurationMs: number;
  totalSignals: number;
  totalCostUsd: number;
  totalTokens: number;
}

export interface ChartPoint {
  label: string;
  value: number;
  secondary?: number;
  tertiary?: number;
}

export interface AgentProfile {
  agentRef: string;
  name: string;
  role: string;
  framework: string;
  description?: string;
  transportIdentity?: string;
  entrypoint?: string;
  bootstrapStrategy?: string;
  bootstrapMode?: string;
  tags?: string[];
  scenarios: string[];
  metrics: {
    runs: number;
    signals: number;
    averageLatencyMs?: number;
    averageConfidence: number;
  };
}

export interface SendRunMessageRequest {
  from: string;
  to?: string[];
  messageType: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface SendSignalRequest {
  from: string;
  to: string[];
  messageType: string;
  payload?: Record<string, unknown>;
  signalType?: string;
  severity?: string;
}

export interface RunExportBundle {
  run: RunRecord;
  session?: Record<string, unknown>;
  projection?: RunStateProjection;
  events?: CanonicalEvent[];
  artifacts?: Artifact[];
  metrics?: MetricsSummary;
}

/* ─── Shared API response types ─── */

export interface MutationAck {
  ok: boolean;
  runId: string;
}

export interface BatchOperationResult {
  results: Array<{ runId: string; ok: boolean }>;
}

export interface RebuildProjectionResult {
  rebuilt: boolean;
  latestSeq: number;
}

export interface CircuitBreakerResult {
  status: string;
  state: string;
}

export interface RunExampleResult {
  compiled: CompileLaunchResult;
  hostedAgents: Array<Record<string, unknown>>;
  controlPlane: {
    baseUrl: string;
    validated: boolean;
    submitted: boolean;
    runId: string;
    status: string;
    traceId: string;
  };
}

export interface CreateArtifactResult {
  id: string;
  runId: string;
  kind: string;
  label: string;
  uri?: string;
  inline?: Record<string, unknown>;
  createdAt: string;
}

export interface AgentMetricsEntry {
  agentRef: string;
  runs: number;
  signals: number;
  messages: number;
  averageLatencyMs?: number;
  averageConfidence: number;
}

export interface AppPreferences {
  theme: 'dark' | 'light';
  demoMode: boolean;
  autoFollow: boolean;
  showCriticalPath: boolean;
  showParallelBranches: boolean;
  replaySpeed: number;
  logsDensity: 'compact' | 'comfortable';
}
