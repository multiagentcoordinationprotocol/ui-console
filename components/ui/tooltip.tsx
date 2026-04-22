'use client';

import type { ReactElement, ReactNode } from 'react';
import { cloneElement, useId, useState } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Tooltip primitive — R4.1.
 *
 * CSS-positioned (no portal, no floating-ui); shows on hover of the child
 * and on keyboard focus. The child must accept `aria-describedby` — use a
 * native element (button, span, code) or a component that forwards props.
 *
 * Used for finding #2 / Q6 — layered `commitmentId` tooltip in the policy
 * evaluations table — and anywhere else a hint-on-hover is useful.
 *
 * Visual treatment is v2-native (see plans/ui-improvement-plan.md finding
 * #14). Legacy pages work fine — the tooltip renders above the trigger
 * regardless of the surrounding design version.
 *
 * Usage:
 *   <Tooltip label="Approve a step-up authentication challenge">
 *     <code>c-stepup-approve</code>
 *   </Tooltip>
 */
interface TooltipProps {
  /** The hint text shown on hover/focus. Keep short (≤ 80 chars). */
  label: ReactNode;
  /** Target element. Must render a single child that accepts `aria-describedby`. */
  children: ReactElement<{ 'aria-describedby'?: string; className?: string }>;
  /** Placement above (default) or below the target. */
  side?: 'top' | 'bottom';
  /** Additional class for the wrapping span. */
  className?: string;
}

export function Tooltip({ label, children, side = 'top', className }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  const child = cloneElement(children, {
    'aria-describedby': open ? tooltipId : undefined
  });

  return (
    <span
      className={cn('tooltip-root', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {child}
      <span
        role="tooltip"
        id={tooltipId}
        className={cn('tooltip-bubble', `tooltip-bubble-${side}`, open && 'tooltip-bubble-open')}
      >
        {label}
      </span>
    </span>
  );
}
