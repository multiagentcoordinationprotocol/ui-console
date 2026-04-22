import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="Nothing yet" />);
    expect(screen.getByRole('heading', { name: 'Nothing yet', level: 4 })).toBeInTheDocument();
  });

  it('renders optional description + icon + action', () => {
    render(
      <EmptyState icon={<svg data-testid="icon" />} title="t" description="help text" action={<button>Go</button>} />
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('help text')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
  });

  it('applies compact variant', () => {
    const { container } = render(<EmptyState title="t" compact />);
    expect(container.firstChild).toHaveClass('empty-state', 'compact');
  });
});
