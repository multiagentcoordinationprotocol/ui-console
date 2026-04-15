import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Panel, PanelHeader, PanelBody } from './panel';

describe('Panel', () => {
  it('renders composed sections', () => {
    render(
      <Panel>
        <PanelHeader title="Recent runs" subtitle="Last 24h" action={<button>All →</button>} />
        <PanelBody>content here</PanelBody>
      </Panel>
    );
    expect(screen.getByText('Recent runs')).toBeInTheDocument();
    expect(screen.getByText('Last 24h')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All →' })).toBeInTheDocument();
    expect(screen.getByText('content here')).toBeInTheDocument();
  });

  it('applies tight body when requested', () => {
    const { container } = render(
      <Panel>
        <PanelBody tight>x</PanelBody>
      </Panel>
    );
    expect(container.querySelector('.panel-body.tight')).toBeInTheDocument();
  });
});
