import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiCard } from './kpi-card';

describe('KpiCard', () => {
  it('renders label + value', () => {
    render(<KpiCard label="Total runs" value="1,284" />);
    expect(screen.getByText('Total runs')).toBeInTheDocument();
    expect(screen.getByText('1,284')).toBeInTheDocument();
  });

  it('renders optional meta + delta', () => {
    render(<KpiCard label="Latency" value="1.8s" meta="Active 3" delta="−0.3s" deltaDirection="up" />);
    expect(screen.getByText('Active 3')).toBeInTheDocument();
    // Delta text is prefixed with an arrow when direction is up.
    expect(screen.getByText(/−0\.3s/)).toBeInTheDocument();
  });

  it('applies data-accent for top-stripe variants', () => {
    const { container } = render(<KpiCard label="t" value="1" accent="green" />);
    expect(container.firstChild).toHaveAttribute('data-accent', 'green');
  });

  it('omits the delta block when delta not provided', () => {
    const { container } = render(<KpiCard label="t" value="1" />);
    expect(container.querySelector('.kpi-delta')).toBeNull();
  });
});
