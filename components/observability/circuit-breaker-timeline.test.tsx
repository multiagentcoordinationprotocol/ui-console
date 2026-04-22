import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CircuitBreakerTimeline } from './circuit-breaker-timeline';
import type { CircuitBreakerHistoryEntry } from '@/lib/api/client';

describe('CircuitBreakerTimeline', () => {
  const now = Date.now();
  const entries: CircuitBreakerHistoryEntry[] = [
    { state: 'CLOSED', enteredAt: new Date(now - 1000 * 60 * 60).toISOString() },
    { state: 'OPEN', enteredAt: new Date(now - 1000 * 60 * 30).toISOString(), reason: 'Runtime down' },
    { state: 'CLOSED', enteredAt: new Date(now - 1000 * 60 * 15).toISOString() }
  ];

  it('renders current state with tone and reason fallback', () => {
    render(<CircuitBreakerTimeline entries={entries} />);
    expect(screen.getByText(/Current: CLOSED/i)).toBeInTheDocument();
    expect(screen.getByText('Runtime down')).toBeInTheDocument();
  });

  it('renders one timeline segment per history entry', () => {
    render(<CircuitBreakerTimeline entries={entries} />);
    const list = screen.getByRole('list', { name: /Circuit breaker state timeline/i });
    expect(list.children.length).toBe(entries.length);
  });

  it('returns null (renders nothing) when history is empty', () => {
    const { container } = render(<CircuitBreakerTimeline entries={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
