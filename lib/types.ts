export type RunStatus = 'queued' | 'starting' | 'binding_session' | 'running' | 'completed' | 'failed' | 'cancelled';

export type ExecutionMode = 'live' | 'replay' | 'sandbox';
export type SessionState =
  | 'SESSION_STATE_UNSPECIFIED'
  | 'SESSION_STATE_OPEN'
  | 'SESSION_STATE_RESOLVED'
  | 'SESSION_STATE_EXPIRED';

/* ─── Policy governance (RFC-MACP-0012) ─── */

export type PolicyType = 'none' | 'majority' | 'supermajority' | 'unanimous' | string;
export type VotingAlgorithm = 'none' | 'majority' | 'supermajority' | 'unanimous' | 'weighted';
export type CommitmentAuthority = 'initiator_only' | 'designated_roles' | 'any_participant';

export interface PolicyHints {
  type?: PolicyType;
  description?: string;
  threshold?: number;
  vetoEnabled?: boolean;
  vetoRoles?: string[];
  vetoThreshold?: number;
  minimumConfidence?: number;
  designatedRoles?: string[];
  criticalSeverityVetoes?: boolean;
}

export interface CommitmentEvaluation {
  commitmentId: string;
  decision: 'allow' | 'deny';
  reasons: string[];
  ts: string;
}

/** BE-8 — commitment definition carried into the projection. */
export interface ExpectedCommitment {
  commitmentId: string;
  title?: string;
  description?: string;
  requiredRoles?: string[];
}

/** BE-9 — structured vote tally per commitment. */
export interface CommitmentVoteTally {
  commitmentId: string;
  allow: number;
  deny: number;
  threshold: number;
  quorum: { required: number; cast: number };
}

export type QuorumStatus = 'pending' | 'reached' | 'failed';

export interface PolicyProjection {
  policyVersion: string;
  policyDescription?: string;
  resolvedAt?: string;
  outcomePositive?: boolean;
  commitmentEvaluations: CommitmentEvaluation[];
  /** BE-8 / §2.4 — expected commitments, populated at binding_session time. */
  expectedCommitments?: ExpectedCommitment[];
  /** BE-9 / §2.5 — per-commitment tally of in-progress voting. */
  voteTally?: CommitmentVoteTally[];
  /** BE-9 / §2.5 — overall quorum status for the policy. */
  quorumStatus?: QuorumStatus;
}

export interface PolicyDefinition {
  policy_id: string;
  mode: string;
  schema_version: number;
  description: string;
  rules: {
    voting: {
      algorithm: VotingAlgorithm;
      threshold?: number;
      quorum?: { type: 'count' | 'percentage'; value: number };
      weights?: Record<string, number>;
    };
    objection_handling: {
      critical_severity_vetoes: boolean;
      veto_threshold: number;
    };
    evaluation: {
      minimum_confidence: number;
      required_before_voting: boolean;
    };
    commitment: {
      authority: CommitmentAuthority;
      require_vote_quorum: boolean;
      designated_roles: string[];
    };
  };
}

export interface RuntimePolicyDescriptor {
  policyId: string;
  mode: string;
  description: string;
  rules: Record<string, unknown>;
  schemaVersion: number;
  registeredAtUnixMs?: number;
}

export interface RegisterPolicyRequest {
  policyId: string;
  mode: string;
  description: string;
  rules: Record<string, unknown>;
  schemaVersion?: number;
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

export interface DashboardRunSummary {
  id: string;
  status: RunStatus;
  runtimeKind: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  scenarioRef?: string;
  environment?: string;
  durationMs?: number;
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
  schemaVersion?: number;
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

/**
 * BE §3.3 (re-scoped) — `llm.call.completed` event payload.
 *
 * Synthesized by the Control Plane from message metadata (`llmCall` or
 * `tokenUsage`). Content is inline (subject to `RedactionService`
 * applied in the normalizer); `artifactId` is present when an agent
 * pre-pinned a context artifact.
 */
export interface LlmCallCompletedData {
  participantId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  prompt?: string;
  redactedPrompt?: string;
  response?: string;
  contextRef?: { artifactId?: string; uri?: string };
  resultingEventIds?: string[];
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
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
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
      /**
       * BE-3 / §1.3 — explicit `boolean | null` on resolved runs.
       *  - `true`  → positive outcome
       *  - `false` → negative outcome
       *  - `null`  → decision finalized but no outcome semantics declared
       *  - `undefined` → decision not yet resolved
       */
      outcomePositive?: boolean | null;
      proposalId?: string;
      /** BE-5 / §2.1 — per-contributor breakdown. */
      proposals?: Array<{
        participantId: string;
        action: string;
        confidence?: number;
        reasons: string[];
        ts: string;
        vote?: 'allow' | 'deny';
      }>;
      /** BE-6 / §2.2 — when the decision resolved. */
      resolvedAt?: string;
      /** BE-6 / §2.2 — aggregator participant id that resolved the decision. */
      resolvedBy?: string;
      /** BE-7 / §2.3 — scenario-provided decision prompt (not a reason). */
      prompt?: string;
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
  policy: PolicyProjection;
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
  completedRuns: number;
  failedRuns: number;
  cancelledRuns: number;
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

export interface RunExportBundle {
  run: RunRecord;
  session: Record<string, unknown> | null;
  projection: RunStateProjection | null;
  canonicalEvents: CanonicalEvent[] | null;
  rawEvents: Record<string, unknown>[] | null;
  artifacts: Artifact[];
  metrics: MetricsSummary | null;
  exportedAt: string;
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
    policyRegistered?: boolean;
    policyVersion?: string;
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
  /**
   * R3.3 — design-system version switch.
   *  - 'v1' (default): current production UI.
   *  - 'v2': the redesign from plans/ui-improvement-plan.md finding #14,
   *    scoped under `:root[data-design='v2']` CSS tokens.
   *
   * Override at runtime via `?design=v2` query param (ProvidersInner
   * applies it on mount). The override persists into this store so
   * subsequent navigations keep v2 on. Reset to v1 by visiting
   * `?design=v1` or clearing the stored preferences.
   */
  designVersion: 'v1' | 'v2';
}

/* ─── Query parameter types ─── */

export interface ListRunsQuery {
  status?: RunStatus;
  tags?: string[];
  createdAfter?: string;
  createdBefore?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  includeArchived?: boolean;
  environment?: string;
  scenarioRef?: string;
  search?: string;
}

export interface ListAuditQuery {
  actor?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  createdAfter?: string;
  createdBefore?: string;
  limit?: number;
  offset?: number;
}

export interface ExportRunQuery {
  includeCanonical?: boolean;
  includeRaw?: boolean;
  eventLimit?: number;
  format?: 'json' | 'jsonl';
}

export interface ReadinessProbeResponse {
  ok: boolean;
  database: string;
  runtime: { ok: boolean; runtimeKind?: string; detail?: string };
  streamConsumer: string;
  circuitBreaker: string;
}
