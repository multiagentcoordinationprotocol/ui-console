import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventDetailDialog } from './event-detail-dialog';
import { ToastProvider } from './toast';

/**
 * Tests for PR-A5. jsdom implements `<dialog>` but `showModal()` is
 * not always available — we focus on prop wiring (title/meta/payload
 * render) and onClose propagation, not native dialog behaviour.
 */

function wrap(children: React.ReactNode) {
  return <ToastProvider>{children}</ToastProvider>;
}

describe('EventDetailDialog', () => {
  it('renders title, subtitle, meta rows and payload', () => {
    render(
      wrap(
        <EventDetailDialog
          open
          onClose={() => {}}
          title="proposal.submitted"
          subtitle="seq 42"
          meta={[
            { label: 'Source', value: 'runtime · macp' },
            { label: 'Event id', value: <code>ev-123</code> }
          ]}
          payload={{ action: 'approve', confidence: 0.87 }}
        />
      )
    );
    expect(screen.getByText('proposal.submitted')).toBeInTheDocument();
    expect(screen.getByText('seq 42')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('runtime · macp')).toBeInTheDocument();
    expect(screen.getByText('ev-123')).toBeInTheDocument();
    // Payload renders in a <pre> via JsonViewer
    expect(screen.getByText(/"action": "approve"/)).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(wrap(<EventDetailDialog open onClose={onClose} title="t" payload={{}} />));
    const closeBtn = screen.getByRole('button', { name: /Close dialog/i });
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('renders an extra slot when provided', () => {
    render(
      wrap(
        <EventDetailDialog open onClose={() => {}} title="t" payload={{}}>
          <p>Linked artifacts: 2</p>
        </EventDetailDialog>
      )
    );
    expect(screen.getByText('Linked artifacts: 2')).toBeInTheDocument();
  });
});
