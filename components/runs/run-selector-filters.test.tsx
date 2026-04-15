import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RunSelectorFilters } from './run-selector-filters';
import type { RunRecord } from '@/lib/types';

function mkRun(over: Partial<RunRecord>): RunRecord {
  return {
    id: 'run-' + Math.random().toString(16).slice(2, 10),
    status: 'completed',
    runtimeKind: 'macp',
    runtimeVersion: 'v1',
    createdAt: '2026-04-14T00:00:00Z',
    ...over
  } as RunRecord;
}

describe('RunSelectorFilters', () => {
  const runs: RunRecord[] = [
    mkRun({
      source: { kind: 'scenario-registry', ref: 'fraud/high-value-new-device@1.0.0' },
      metadata: { environment: 'staging' }
    }),
    mkRun({
      source: { kind: 'scenario-registry', ref: 'fraud/high-value-new-device@1.0.0' },
      metadata: { environment: 'prod' }
    }),
    mkRun({ source: { kind: 'scenario-registry', ref: 'trust/onboarding@1.0.0' } })
  ];

  it('renders only the enabled controls', () => {
    render(<RunSelectorFilters value={{}} onChange={() => {}} showScenario showWindow />);
    expect(screen.getByText('Scenario')).toBeInTheDocument();
    expect(screen.getByText('Time window')).toBeInTheDocument();
    expect(screen.queryByText('Run')).not.toBeInTheDocument();
    expect(screen.queryByText('Status')).not.toBeInTheDocument();
    expect(screen.queryByText('Environment')).not.toBeInTheDocument();
  });

  it('dedupes scenarios from runs', () => {
    render(<RunSelectorFilters value={{}} onChange={() => {}} runs={runs} showScenario />);
    const options = screen.getAllByRole('option');
    // All scenarios + the "All scenarios" option = 3
    expect(options).toHaveLength(3);
    expect(options.map((o) => o.textContent)).toEqual([
      'All scenarios',
      'fraud/high-value-new-device@1.0.0',
      'trust/onboarding@1.0.0'
    ]);
  });

  it('emits onChange when scenario selection changes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<RunSelectorFilters value={{}} onChange={onChange} runs={runs} showScenario />);
    await user.selectOptions(screen.getByRole('combobox'), 'trust/onboarding@1.0.0');
    expect(onChange).toHaveBeenCalledWith({ scenario: 'trust/onboarding@1.0.0' });
  });

  it('status=all clears the status key', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<RunSelectorFilters value={{ status: 'failed' }} onChange={onChange} showStatus />);
    await user.selectOptions(screen.getByRole('combobox'), 'all');
    expect(onChange).toHaveBeenLastCalledWith({ status: undefined });
  });

  it('default window is 24h', () => {
    render(<RunSelectorFilters value={{}} onChange={() => {}} showWindow />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('24h');
  });
});
