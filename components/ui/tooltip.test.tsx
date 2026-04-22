import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from './tooltip';

describe('Tooltip', () => {
  it('renders the trigger child', () => {
    render(
      <Tooltip label="Hint text">
        <button type="button">Target</button>
      </Tooltip>
    );
    expect(screen.getByRole('button', { name: 'Target' })).toBeInTheDocument();
  });

  it('bubble exists in the DOM (for accessible-name relationships) even while closed', () => {
    render(
      <Tooltip label="Hint text">
        <button type="button">Target</button>
      </Tooltip>
    );
    // The bubble is always rendered; visibility is driven by the
    // `tooltip-bubble-open` class. This keeps the aria-describedby
    // target in the DOM.
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Hint text');
  });

  it('toggles the open class on hover', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip label="Hint text">
        <button type="button">Target</button>
      </Tooltip>
    );
    const bubble = screen.getByRole('tooltip');
    expect(bubble).not.toHaveClass('tooltip-bubble-open');

    await user.hover(screen.getByRole('button', { name: 'Target' }));
    expect(bubble).toHaveClass('tooltip-bubble-open');

    await user.unhover(screen.getByRole('button', { name: 'Target' }));
    expect(bubble).not.toHaveClass('tooltip-bubble-open');
  });

  it('toggles on keyboard focus', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Other</button>
        <Tooltip label="Hint text">
          <button type="button">Target</button>
        </Tooltip>
      </>
    );
    const bubble = screen.getByRole('tooltip');

    // Tab from the other button into the tooltip target.
    screen.getByRole('button', { name: 'Other' }).focus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Target' })).toHaveFocus();
    expect(bubble).toHaveClass('tooltip-bubble-open');

    await user.tab();
    expect(bubble).not.toHaveClass('tooltip-bubble-open');
  });

  it('links trigger to bubble via aria-describedby when open', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip label="Hint text">
        <button type="button">Target</button>
      </Tooltip>
    );
    const target = screen.getByRole('button', { name: 'Target' });
    expect(target).not.toHaveAttribute('aria-describedby');

    await user.hover(target);
    expect(target).toHaveAttribute('aria-describedby', screen.getByRole('tooltip').id);
  });

  it('applies the side class', () => {
    render(
      <Tooltip label="Hint" side="bottom">
        <button type="button">Target</button>
      </Tooltip>
    );
    expect(screen.getByRole('tooltip')).toHaveClass('tooltip-bubble-bottom');
  });
});
