import { describe, it, expect } from 'vitest';
import { buildOutcomeNarrative, type DecisionExplanation } from './run-story';
import type { RunRecord, RunStateProjection } from '../types';

// buildOutcomeNarrative only reads run.status, state.decision.current, and the
// story.decision/inputs — so minimal casts keep the fixtures focused.
function makeRun(status: string): RunRecord {
  return { status } as unknown as RunRecord;
}

function makeState(current?: { finalized?: boolean; action?: string }): RunStateProjection {
  return { decision: { current } } as unknown as RunStateProjection;
}

function makeDecision(overrides: Partial<DecisionExplanation> = {}): DecisionExplanation {
  return { totalVotes: 0, approveCount: 0, rejectCount: 0, evaluatorReasons: [], ...overrides };
}

function narrative(run: RunRecord, state: RunStateProjection, decision: DecisionExplanation) {
  return buildOutcomeNarrative(run, state, { agents: [], inputs: [], decision });
}

describe('buildOutcomeNarrative', () => {
  it('renders a negative committed outcome as declined (completed run)', () => {
    const out = narrative(
      makeRun('completed'),
      makeState({ finalized: true, action: 'reject' }),
      makeDecision({ outcomePositive: false, finalAction: 'reject', totalVotes: 4, approveCount: 1, rejectCount: 3 })
    );
    expect(out.badge).toBe('negative');
    expect(out.headline.toLowerCase()).toContain('declined');
    expect(out.body.toLowerCase()).toContain('declined');
  });

  it('treats a decision-finalized run as finalized even when run.status !== completed (§1 regression)', () => {
    // The reject-majority run surfaced as a non-'completed' status (discovered/
    // replayed session), but the decision itself is finalized-negative. It must
    // NOT fall back to the neutral "not yet finalized" copy.
    const out = narrative(
      makeRun('running'),
      makeState({ finalized: true, action: 'reject' }),
      makeDecision({ outcomePositive: false, finalAction: 'reject' })
    );
    expect(out.badge).toBe('negative');
    expect(out.headline.toLowerCase()).toContain('declined');
    expect(out.body.toLowerCase()).not.toContain('not yet finalized');
  });

  it('stays neutral / not-yet-finalized for a running run with no finalized decision', () => {
    const out = narrative(makeRun('running'), makeState(undefined), makeDecision({ outcomePositive: null }));
    expect(out.badge).toBe('neutral');
    expect(out.body.toLowerCase()).toContain('not yet finalized');
  });

  it('renders a positive committed outcome as approved', () => {
    const out = narrative(
      makeRun('completed'),
      makeState({ finalized: true, action: 'approve' }),
      makeDecision({ outcomePositive: true, finalAction: 'approve', totalVotes: 4, approveCount: 4 })
    );
    expect(out.badge).toBe('positive');
    expect(out.headline.toLowerCase()).toContain('approved');
  });
});
