import type { CanonicalEvent, MetricsSummary, RunRecord, RunStateProjection } from '@/lib/types';

export interface ScenarioHeader {
  title: string;
  scenarioRef: string;
  modeName?: string;
  policyVersion?: string;
  expectedDecisionKinds?: string[];
}

export interface InputField {
  label: string;
  value: string;
  raw: unknown;
}

export interface AgentLlmCall {
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs?: number;
  prompt?: string;
  response?: string;
  summary?: string;
}

export interface AgentNarrative {
  participantId: string;
  role?: string;
  framework?: string;
  agentRef?: string;
  status: string;
  task?: string;
  vote?: string;
  recommendation?: string;
  reason?: string;
  confidence?: number;
  llmCall?: AgentLlmCall;
  progressPct?: number;
  signalCount: number;
}

export interface DecisionExplanation {
  policyVersion?: string;
  policyDescription?: string;
  algorithm?: string;
  threshold?: number;
  quorumValue?: number;
  totalVotes: number;
  approveCount: number;
  rejectCount: number;
  evaluatorReasons: string[];
  finalAction?: string;
  outcomePositive?: boolean | null;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface OutcomeNarrative {
  badge: 'positive' | 'negative' | 'neutral';
  headline: string;
  body: string;
}

export interface RunStory {
  header: ScenarioHeader;
  inputs: InputField[];
  agents: AgentNarrative[];
  decision: DecisionExplanation;
  outcome: OutcomeNarrative;
}

function readPath(obj: unknown, path: (string | number)[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur && typeof cur === 'object') {
      cur = (cur as Record<string, unknown>)[String(key)];
    } else {
      return undefined;
    }
  }
  return cur;
}

function asString(v: unknown): string | undefined {
  if (typeof v === 'string' && v.length > 0) return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return undefined;
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function asObject(v: unknown): Record<string, unknown> | undefined {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return undefined;
}

function humanizeKey(k: string): string {
  return k
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function buildScenarioHeader(run: RunRecord, state: RunStateProjection): ScenarioHeader {
  const session = asObject(readPath(run.metadata, ['executionRequest', 'session']));
  const sessionMeta = asObject(session?.metadata);
  const scenarioRef =
    asString(sessionMeta?.scenarioRef) ??
    asString(sessionMeta?.sourceRef) ??
    asString(run.source?.ref) ??
    'unknown scenario';

  const title = scenarioRef
    .replace(/^.*\//, '')
    .replace(/@.*/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title,
    scenarioRef,
    modeName: state.run.modeName,
    policyVersion: state.policy?.policyVersion,
    expectedDecisionKinds: undefined
  };
}

export function buildInputsTable(run: RunRecord, events: CanonicalEvent[] = []): InputField[] {
  const session = asObject(readPath(run.metadata, ['executionRequest', 'session']));
  const sessionMeta = asObject(session?.metadata);
  let ctx: Record<string, unknown> | undefined =
    asObject(sessionMeta?.session_context) ??
    asObject(sessionMeta?.sessionContext) ??
    asObject(readPath(sessionMeta, ['hostedParticipants', 0, 'participantMetadata', 'session_context']));

  // Discovered sessions don't carry session_context in run metadata. The
  // initiator emits a `session.context` Signal at startup carrying the inputs;
  // pull from there when the metadata path is empty.
  if (!ctx) {
    for (const ev of events) {
      if (ev.type !== 'signal.emitted') continue;
      const data = (ev.data ?? {}) as Record<string, unknown>;
      const decoded = asObject(data.payload) ?? data;
      const sigType = asString(decoded.signalType ?? decoded.signal_type);
      if (sigType !== 'session.context') continue;
      const rawData = decoded.data;
      let parsed: Record<string, unknown> | undefined;
      if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
        parsed = rawData as Record<string, unknown>;
      } else if (typeof rawData === 'string') {
        try {
          parsed = safeJsonParse(atob(rawData));
        } catch {
          parsed = safeJsonParse(rawData);
        }
      }
      if (parsed) {
        ctx = parsed;
        break;
      }
    }
  }

  if (!ctx) return [];

  return Object.entries(ctx).map(([k, v]) => ({
    label: humanizeKey(k),
    value: formatValue(v),
    raw: v
  }));
}

export function buildAgentNarratives(
  run: RunRecord,
  state: RunStateProjection,
  events: CanonicalEvent[]
): AgentNarrative[] {
  const sessionMeta = asObject(readPath(run.metadata, ['executionRequest', 'session', 'metadata']));
  const hosted = (sessionMeta?.hostedParticipants as Array<Record<string, unknown>> | undefined) ?? [];

  const llmByParticipant = new Map<string, AgentLlmCall>();
  for (const ev of events) {
    if (ev.type !== 'llm.call.completed' && ev.type !== 'signal.emitted') continue;
    const data = (ev.data ?? {}) as Record<string, unknown>;
    if (ev.type === 'signal.emitted') {
      const decoded = asObject(data.payload) ?? data;
      const sigType = asString(decoded.signalType ?? decoded.signal_type);
      if (sigType !== 'llm.call.completed') continue;
      // payload.data may already be a parsed object OR a base64-encoded JSON string.
      const rawData = decoded.data;
      let sigData: Record<string, unknown> | undefined;
      if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
        sigData = rawData as Record<string, unknown>;
      } else if (typeof rawData === 'string') {
        // Try base64 first (CP wire format), fall back to direct JSON.
        try {
          const decoded64 = atob(rawData);
          sigData = safeJsonParse(decoded64);
        } catch {
          sigData = safeJsonParse(rawData);
        }
      }
      if (!sigData) continue;
      const pid = asString(sigData.participantId) ?? asString(data.sender) ?? asString(ev.subject?.id);
      if (!pid) continue;
      llmByParticipant.set(pid, normalizeLlm(sigData));
    } else {
      // Synthesized llm.call.completed event: details live under data.decodedPayload,
      // and the agent identity is data.sender (not participantId).
      const decodedPayload = asObject(data.decodedPayload) ?? data;
      const pid =
        asString(data.sender) ??
        asString(data.participantId) ??
        asString(decodedPayload.participantId) ??
        asString(ev.subject?.id);
      if (!pid) continue;
      llmByParticipant.set(pid, normalizeLlm(decodedPayload));
    }
  }

  const proposalByParticipant = new Map<
    string,
    NonNullable<NonNullable<RunStateProjection['decision']['current']>['proposals']>[number]
  >();
  for (const p of state.decision.current?.proposals ?? []) {
    proposalByParticipant.set(p.participantId, p);
  }

  const progressByParticipant = new Map<string, number>();
  for (const p of state.progress.entries) {
    if (typeof p.percentage === 'number') {
      const prev = progressByParticipant.get(p.participantId) ?? 0;
      if (p.percentage >= prev) progressByParticipant.set(p.participantId, p.percentage);
    }
  }

  const signalsByParticipant = new Map<string, number>();
  for (const s of state.signals.signals) {
    const pid = s.sourceParticipantId;
    if (!pid) continue;
    signalsByParticipant.set(pid, (signalsByParticipant.get(pid) ?? 0) + 1);
  }

  return state.participants.map((part) => {
    const hostedEntry = hosted.find((h) => asString(h.participantId) === part.participantId);
    const meta = asObject(hostedEntry?.participantMetadata);
    const role = asString(meta?.role) ?? part.role;
    const framework = asString(meta?.framework);
    const agentRef = asString(meta?.agentRef) ?? part.participantId;
    const proposal = proposalByParticipant.get(part.participantId);

    return {
      participantId: part.participantId,
      role,
      framework,
      agentRef,
      status: part.status,
      task: roleToTask(role, framework),
      vote: proposal?.vote ? proposal.vote.toUpperCase() : undefined,
      recommendation: proposal?.action,
      reason: proposal?.reasons?.[0],
      confidence: proposal?.confidence,
      llmCall: llmByParticipant.get(part.participantId),
      progressPct: progressByParticipant.get(part.participantId),
      signalCount: signalsByParticipant.get(part.participantId) ?? 0
    };
  });
}

function safeJsonParse(s: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(s);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

function normalizeLlm(d: Record<string, unknown>): AgentLlmCall {
  const usage = asObject(d.tokenUsage) ?? d;
  return {
    model: asString(d.model) ?? asString(usage.model),
    promptTokens: asNumber(d.promptTokens) ?? asNumber(usage.promptTokens) ?? asNumber(d.prompt_tokens),
    completionTokens: asNumber(d.completionTokens) ?? asNumber(usage.completionTokens) ?? asNumber(d.completion_tokens),
    totalTokens: asNumber(d.totalTokens) ?? asNumber(usage.totalTokens),
    latencyMs: asNumber(d.latencyMs) ?? asNumber(d.latency_ms),
    prompt: asString(d.prompt),
    response: asString(d.response),
    summary: asString(d.summary)
  };
}

function roleToTask(role?: string, framework?: string): string {
  const fw = framework ? ` (${framework})` : '';
  switch (role) {
    case 'risk':
    case 'initiator':
      return `Coordinate the decision process${fw} — collects votes from specialists and commits the final outcome.`;
    case 'claims-validator':
      return `Validate claim signals${fw} — review device trust, chargeback history, and identity-risk indicators.`;
    case 'customer-advocate':
      return `Assess customer-impact and revenue trade-offs${fw} — represents long-term value perspective.`;
    case 'compliance-reviewer':
      return `Apply policy and regulatory checks${fw} — surfaces compliance objections when warranted.`;
    default:
      return role ? `${humanizeKey(role)}${fw}` : 'Participant in the decision';
  }
}

export function buildDecisionExplanation(state: RunStateProjection, events: CanonicalEvent[]): DecisionExplanation {
  const current = state.decision.current;
  const proposals = current?.proposals ?? [];

  let approveCount = 0;
  let rejectCount = 0;
  for (const p of proposals) {
    if (p.vote === 'allow') approveCount += 1;
    else if (p.vote === 'deny') rejectCount += 1;
  }

  const policy = state.policy;

  let evaluatorReasons: string[] = [];
  for (const ev of events) {
    if (ev.type === 'decision.finalized' || ev.type === 'policy.resolved') {
      const data = (ev.data ?? {}) as Record<string, unknown>;
      const reasons = data.reasons;
      if (Array.isArray(reasons)) {
        evaluatorReasons = reasons.filter((r): r is string => typeof r === 'string');
        break;
      }
    }
  }

  return {
    policyVersion: policy?.policyVersion,
    policyDescription: policy?.policyDescription,
    algorithm: undefined,
    threshold: undefined,
    quorumValue: undefined,
    totalVotes: approveCount + rejectCount,
    approveCount,
    rejectCount,
    evaluatorReasons: evaluatorReasons.length > 0 ? evaluatorReasons : (current?.reasons ?? []),
    finalAction: current?.action,
    outcomePositive: current?.outcomePositive,
    resolvedBy: current?.resolvedBy,
    resolvedAt: current?.resolvedAt
  };
}

export function buildOutcomeNarrative(
  run: RunRecord,
  state: RunStateProjection,
  story: { agents: AgentNarrative[]; decision: DecisionExplanation; inputs: InputField[] }
): OutcomeNarrative {
  const action = story.decision.finalAction ?? state.decision.current?.action;
  const outcomePositive = story.decision.outcomePositive;
  const badge: OutcomeNarrative['badge'] =
    outcomePositive === true ? 'positive' : outcomePositive === false ? 'negative' : 'neutral';

  if (run.status !== 'completed') {
    return {
      badge: 'neutral',
      headline: `Run ${run.status}`,
      body: `This run is currently ${run.status}. Outcome is not yet finalized.`
    };
  }

  const total = story.decision.totalVotes;
  const approve = story.decision.approveCount;
  const headlineAction = action ? action.toUpperCase().replace(/_/g, ' ') : 'COMPLETED';
  const verdict = badge === 'positive' ? 'approved' : badge === 'negative' ? 'declined' : 'finalized';

  const inputSummaryParts: string[] = [];
  for (const f of story.inputs.slice(0, 3)) {
    inputSummaryParts.push(`${f.label.toLowerCase()} ${f.value}`);
  }
  const inputSummary = inputSummaryParts.length > 0 ? ` (${inputSummaryParts.join(', ')})` : '';

  const body =
    total > 0
      ? `${approve} of ${total} reviewers approved this case${inputSummary}. ` +
        (badge === 'positive'
          ? 'Policy threshold met — case approved.'
          : badge === 'negative'
            ? 'Policy threshold not met — case declined.'
            : 'Policy evaluator finalized the decision.')
      : `Decision finalized as ${headlineAction}.`;

  return {
    badge,
    headline: `Outcome: ${headlineAction}`,
    body
  };
}

export function buildRunStory(
  run: RunRecord,
  state: RunStateProjection,
  events: CanonicalEvent[],
  _metrics?: MetricsSummary
): RunStory {
  const header = buildScenarioHeader(run, state);
  const inputs = buildInputsTable(run, events);
  const agents = buildAgentNarratives(run, state, events);
  const decision = buildDecisionExplanation(state, events);
  const outcome = buildOutcomeNarrative(run, state, { agents, decision, inputs });
  return { header, inputs, agents, decision, outcome };
}
