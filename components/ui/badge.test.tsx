import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, StatusBadge } from './badge';

describe('Badge', () => {
  it('renders label with titleCase', () => {
    render(<Badge label="hello_world" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('applies tone class', () => {
    const { container } = render(<Badge label="test" tone="success" />);
    expect(container.firstChild).toHaveClass('badge', 'badge-success');
  });

  it('applies custom className', () => {
    const { container } = render(<Badge label="test" className="custom" />);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('defaults to neutral tone', () => {
    const { container } = render(<Badge label="test" />);
    expect(container.firstChild).toHaveClass('badge-neutral');
  });
});

describe('StatusBadge', () => {
  it('maps completed status to success tone', () => {
    const { container } = render(<StatusBadge status="completed" />);
    expect(container.firstChild).toHaveClass('badge-success');
  });

  it('maps failed status to danger tone', () => {
    const { container } = render(<StatusBadge status="failed" />);
    expect(container.firstChild).toHaveClass('badge-danger');
  });
});
