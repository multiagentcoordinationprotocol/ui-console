import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from './card';

describe('Card', () => {
  it('renders children inside section element', () => {
    const { container } = render(<Card>Card content</Card>);
    expect(container.querySelector('section')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies card class', () => {
    const { container } = render(<Card>Test</Card>);
    expect(container.firstChild).toHaveClass('card');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom">Test</Card>);
    expect(container.firstChild).toHaveClass('card', 'custom');
  });
});

describe('CardHeader', () => {
  it('renders as header element', () => {
    const { container } = render(<CardHeader>Header</CardHeader>);
    expect(container.querySelector('header')).toBeInTheDocument();
  });
});

describe('CardTitle', () => {
  it('renders as h3 element', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title');
  });
});

describe('CardContent', () => {
  it('renders children in div with card-content class', () => {
    const { container } = render(<CardContent>Content</CardContent>);
    expect(container.firstChild).toHaveClass('card-content');
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
