import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { PolicyPanel } from './policy-panel';
import type { PolicyProjection } from '@/lib/types';

/**
 * Integration-style tests for PR-E2 / finding #5.
 * Asserts the panel renders enriched projection fields (BE-8 / BE-9)
 * and falls back to `commitmentEvaluations[]` when new fields are
 * missing. `getRuntimePolicy` is stubbed because the component fetches
 * it via React Query on mount.
 */

vi.mock('@/lib/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/client')>('@/lib/api/client');
  return {
    ...actual,
    getRuntimePolicy: vi.fn().mockResolvedValue(null)
  };
});

function baseEnriched(): PolicyProjection {
  return {
    policyVersion: 'policy.custom-v3',
    policyDescription: 'Majority vote with growth veto.',
    resolvedAt: '2026-04-14T00:10:00Z',
    outcomePositive: true,
    commitmentEvaluations: [
      { commitmentId: 'c-risk', decision: 'allow', reasons: ['threshold met'], ts: '2026-04-14T00:09:00Z' },
      { commitmentId: 'c-growth', decision: 'deny', reasons: ['VIP override'], ts: '2026-04-14T00:08:50Z' }
    ],
    expectedCommitments: [
      {
        commitmentId: 'c-risk',
        title: 'Risk attestation',
        description: 'Risk agents must attest that aggregated signals fall below threshold.',
        requiredRoles: ['risk']
      },
      {
        commitmentId: 'c-growth',
        title: 'Growth veto',
        description: 'Growth can veto outright rejections for VIP customers.',
        requiredRoles: ['growth']
      }
    ],
    voteTally: [
      { commitmentId: 'c-risk', allow: 2, deny: 0, threshold: 0.66, quorum: { required: 2, cast: 2 } },
      { commitmentId: 'c-growth', allow: 0, deny: 1, threshold: 0.5, quorum: { required: 1, cast: 1 } }
    ],
    quorumStatus: 'reached'
  };
}

describe('PolicyPanel — enriched projection (BE-8 / BE-9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders quorum status badge + policy version + satisfied outcome', () => {
    renderWithProviders(<PolicyPanel policy={baseEnriched()} />);
    // Badge's titleCase: 'policy.custom-v3' → 'Policy.custom V3'
    expect(screen.getByText('Policy.custom V3')).toBeInTheDocument();
    // titleCase turns 'quorum:reached' → 'Quorum:reached'
    expect(screen.getByText('Quorum:reached')).toBeInTheDocument();
    expect(screen.getByText('Policy Satisfied')).toBeInTheDocument();
  });

  it('renders one row per expected commitment with tally + quorum counts', () => {
    renderWithProviders(<PolicyPanel policy={baseEnriched()} />);
    // Table shows the commitment ids
    expect(screen.getByText('c-risk')).toBeInTheDocument();
    expect(screen.getByText('c-growth')).toBeInTheDocument();
    // Commitment titles appear in the Tooltip label AND in the inline muted
    // subtitle, so use getAllByText to avoid the "multiple matches" failure.
    expect(screen.getAllByText('Risk attestation').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Growth veto').length).toBeGreaterThanOrEqual(1);
    // Allow / deny counts rendered
    expect(screen.getByText('2')).toBeInTheDocument(); // allow for c-risk
    expect(screen.getByText('1')).toBeInTheDocument(); // deny for c-growth
    // Evaluation decisions rendered (Badge titleCases)
    expect(screen.getByText('Allow')).toBeInTheDocument();
    expect(screen.getByText('Deny')).toBeInTheDocument();
  });

  it('renders View policy link pointing to /policies/[id]', () => {
    renderWithProviders(<PolicyPanel policy={baseEnriched()} />);
    const links = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/policies/policy.custom-v3');
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it('falls back to legacy commitment evaluations when expectedCommitments missing', () => {
    const policy = baseEnriched();
    delete policy.expectedCommitments;
    delete policy.voteTally;
    delete policy.quorumStatus;
    renderWithProviders(<PolicyPanel policy={policy} />);
    expect(screen.getByText('Commitment evaluations')).toBeInTheDocument();
    expect(screen.queryByText('quorum:reached')).not.toBeInTheDocument();
  });

  it('renders empty state when no expected commitments and no evaluations', () => {
    const policy: PolicyProjection = {
      policyVersion: 'policy.default',
      commitmentEvaluations: []
    };
    renderWithProviders(<PolicyPanel policy={policy} />);
    expect(screen.getByText('No commitments declared')).toBeInTheDocument();
  });
});
