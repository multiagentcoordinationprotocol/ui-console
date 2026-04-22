'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CanonicalEvent, MetricsSummary, RunRecord, RunStateProjection } from '@/lib/types';
import { formatDateTime, formatNumber, formatPercent } from '@/lib/utils/format';
import { buildRunStory, type AgentNarrative } from '@/lib/utils/run-story';

/**
 * RunStoryPanel — narrative explainer for a single run.
 *
 * Pulls from existing props (run, state, events, metrics) and assembles
 * a transparent walk-through: scenario → inputs → per-agent activity →
 * decision logic → outcome.
 *
 * Renders gracefully even when LLM call signals are not yet flowing —
 * the per-agent LLM blocks fall back to a "no LLM data captured" hint.
 */
export function RunStoryPanel({
  run,
  state,
  events,
  metrics
}: {
  run: RunRecord;
  state: RunStateProjection;
  events: CanonicalEvent[];
  metrics?: MetricsSummary;
}) {
  const story = useMemo(() => buildRunStory(run, state, events, metrics), [run, state, events, metrics]);
  const [agentsOpen, setAgentsOpen] = useState(true);
  const [inputsOpen, setInputsOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(true);

  const outcomeTone =
    story.outcome.badge === 'positive' ? 'success' : story.outcome.badge === 'negative' ? 'danger' : 'warning';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="inline-list" style={{ gap: 8, alignItems: 'center' }}>
          <Sparkles size={18} />
          Run story
        </CardTitle>
        <CardDescription>
          Plain-language walkthrough — what was tasked, what each agent did, and how the policy turned votes into the
          final decision.
        </CardDescription>
      </CardHeader>
      <CardContent className="stack" style={{ gap: 16 }}>
        {/* Scenario header */}
        <section className="stack" style={{ gap: 6 }}>
          <h3 style={{ margin: 0 }}>📋 Scenario: {story.header.title}</h3>
          <div className="inline-list" style={{ gap: 8, flexWrap: 'wrap' }}>
            <code className="muted small">{story.header.scenarioRef}</code>
            {story.header.modeName ? (
              <Link href={`/modes/${encodeURIComponent(story.header.modeName)}`}>
                <Badge label={story.header.modeName} tone="info" />
              </Link>
            ) : null}
            {story.header.policyVersion ? (
              <Link href={`/policies/${encodeURIComponent(story.header.policyVersion)}`}>
                <Badge label={story.header.policyVersion} tone="info" />
              </Link>
            ) : null}
          </div>
        </section>

        {/* Inputs */}
        <section className="stack" style={{ gap: 6 }}>
          <button
            onClick={() => setInputsOpen((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'pointer',
              color: 'inherit',
              font: 'inherit'
            }}
          >
            {inputsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <strong>Inputs</strong>
            <span className="muted small">({story.inputs.length} fields)</span>
          </button>
          {inputsOpen ? (
            story.inputs.length === 0 ? (
              <div className="muted small">No session context recorded.</div>
            ) : (
              <div className="table-wrap">
                <table className="table" aria-label="Run inputs">
                  <tbody>
                    {story.inputs.map((f) => (
                      <tr key={f.label}>
                        <td style={{ width: 220 }} className="muted small">
                          {f.label}
                        </td>
                        <td className="mono">{f.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : null}
        </section>

        {/* Reviewers */}
        <section className="stack" style={{ gap: 8 }}>
          <button
            onClick={() => setAgentsOpen((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'pointer',
              color: 'inherit',
              font: 'inherit'
            }}
          >
            {agentsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <strong>Reviewers</strong>
            <span className="muted small">({story.agents.length})</span>
          </button>
          {agentsOpen ? (
            story.agents.length === 0 ? (
              <div className="muted small">No participants observed.</div>
            ) : (
              <div className="stack" style={{ gap: 8 }}>
                {story.agents.map((agent) => (
                  <AgentCard key={agent.participantId} agent={agent} />
                ))}
              </div>
            )
          ) : null}
        </section>

        {/* How the decision was made */}
        <section className="stack" style={{ gap: 8 }}>
          <button
            onClick={() => setDecisionOpen((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'pointer',
              color: 'inherit',
              font: 'inherit'
            }}
          >
            {decisionOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <strong>How the decision was made</strong>
          </button>
          {decisionOpen ? (
            <div className="stack" style={{ gap: 6 }}>
              {story.decision.policyVersion ? (
                <div className="muted small">
                  Policy applied:{' '}
                  <Link href={`/policies/${encodeURIComponent(story.decision.policyVersion)}`}>
                    <code>{story.decision.policyVersion}</code>
                  </Link>
                  {story.decision.policyDescription ? <span> — {story.decision.policyDescription}</span> : null}
                </div>
              ) : (
                <div className="muted small">No policy attached.</div>
              )}
              <div className="muted small">
                Votes received: <strong>{story.decision.approveCount}</strong> APPROVE ·{' '}
                <strong>{story.decision.rejectCount}</strong> REJECT ({story.decision.totalVotes} total)
              </div>
              {story.decision.evaluatorReasons.length > 0 ? (
                <div className="list-item">
                  <div className="list-item-title">Evaluator verdict</div>
                  <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                    {story.decision.evaluatorReasons.map((r, i) => (
                      <li key={i} style={{ margin: '4px 0' }}>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {story.decision.resolvedBy || story.decision.resolvedAt ? (
                <div className="muted small">
                  {story.decision.resolvedBy ? (
                    <>
                      Committed by <code>{story.decision.resolvedBy}</code>
                    </>
                  ) : null}
                  {story.decision.resolvedAt ? (
                    <>
                      {story.decision.resolvedBy ? ' · ' : 'Committed '}
                      {formatDateTime(story.decision.resolvedAt)}
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* Outcome */}
        <section
          className="stack"
          style={{
            gap: 6,
            padding: '12px 14px',
            borderRadius: 8,
            background: 'var(--surface-2, rgba(0,0,0,0.04))'
          }}
        >
          <div className="inline-list" style={{ gap: 8, alignItems: 'center' }}>
            <FileText size={16} />
            <strong>{story.outcome.headline}</strong>
            <Badge label={story.outcome.badge} tone={outcomeTone} />
          </div>
          <div className="muted small">{story.outcome.body}</div>
        </section>
      </CardContent>
    </Card>
  );
}

function AgentCard({ agent }: { agent: AgentNarrative }) {
  const [llmOpen, setLlmOpen] = useState(false);
  const llm = agent.llmCall;
  const hasLlm = !!llm && (llm.promptTokens || llm.completionTokens || llm.model || llm.summary);

  const voteTone = agent.vote === 'APPROVE' || agent.vote === 'ALLOW' ? 'success' : agent.vote ? 'danger' : 'neutral';

  return (
    <div
      className="stack"
      style={{
        gap: 6,
        padding: '10px 12px',
        border: '1px solid var(--border, rgba(0,0,0,0.1))',
        borderRadius: 8
      }}
    >
      <div className="inline-list" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <code style={{ fontWeight: 600 }}>{agent.participantId}</code>
        {agent.framework ? <Badge label={agent.framework} /> : null}
        {agent.role ? <Badge label={agent.role} tone="info" /> : null}
        <Badge label={agent.status} tone={agent.status === 'completed' ? 'success' : 'neutral'} />
        {typeof agent.progressPct === 'number' ? (
          <span className="muted small mono">progress {agent.progressPct}%</span>
        ) : null}
      </div>
      {agent.task ? <div className="muted small">{agent.task}</div> : null}

      {hasLlm ? (
        <details open={llmOpen} onToggle={(e) => setLlmOpen((e.currentTarget as HTMLDetailsElement).open)}>
          <summary style={{ cursor: 'pointer', listStyle: 'revert' }}>
            <span className="inline-list" style={{ gap: 6, alignItems: 'center' }}>
              <code className="mono small">{llm?.model ?? 'llm call'}</code>
              {typeof llm?.promptTokens === 'number' && typeof llm?.completionTokens === 'number' ? (
                <span className="muted small mono">
                  {formatNumber(llm.promptTokens)} → {formatNumber(llm.completionTokens)} toks
                </span>
              ) : null}
              {typeof llm?.latencyMs === 'number' ? <span className="muted small mono">{llm.latencyMs}ms</span> : null}
              {llm?.summary ? <span className="muted small">{llm.summary}</span> : null}
            </span>
          </summary>
          <div className="stack" style={{ gap: 8, marginTop: 8 }}>
            {llm?.prompt ? (
              <div>
                <div className="muted small" style={{ marginBottom: 4 }}>
                  Prompt
                </div>
                <pre className="json-viewer" style={{ maxHeight: 200, whiteSpace: 'pre-wrap' }}>
                  {llm.prompt}
                </pre>
              </div>
            ) : null}
            {llm?.response ? (
              <div>
                <div className="muted small" style={{ marginBottom: 4 }}>
                  Response
                </div>
                <pre className="json-viewer" style={{ maxHeight: 200, whiteSpace: 'pre-wrap' }}>
                  {llm.response}
                </pre>
              </div>
            ) : null}
          </div>
        </details>
      ) : (
        <div className="muted small">
          No LLM call data captured for this agent yet
          <span className="small"> (requires `llm.call.completed` signal)</span>.
        </div>
      )}

      <div className="inline-list" style={{ gap: 8, alignItems: 'center' }}>
        <span className="muted small">Concluded:</span>
        {agent.vote ? <Badge label={agent.vote} tone={voteTone} /> : <span className="muted small">No vote</span>}
        {agent.recommendation ? <span className="muted small">— {agent.recommendation}</span> : null}
        {typeof agent.confidence === 'number' ? (
          <span className="muted small mono">conf {formatPercent(agent.confidence)}</span>
        ) : null}
      </div>
      {agent.reason ? <div className="muted small">{agent.reason}</div> : null}
    </div>
  );
}
