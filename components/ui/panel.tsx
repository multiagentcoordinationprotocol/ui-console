import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Panel primitive — R4.8 + finding #15 (UX organization).
 *
 * Unifies the ad-hoc `Card + CardHeader + section-actions` pattern that
 * is scattered across the app. The mockup treats every logical section
 * as a "panel" — title on the left, action link on the right (usually
 * `View all →`), body below.
 *
 * Usage:
 *   <Panel>
 *     <PanelHeader title="Recent Runs" subtitle="Last 24 hours"
 *                  action={<Link href="/runs">All runs →</Link>} />
 *     <PanelBody>
 *       ...
 *     </PanelBody>
 *   </Panel>
 */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('panel', className)}>{children}</div>;
}

interface PanelHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function PanelHeader({ title, subtitle, action }: PanelHeaderProps) {
  return (
    <div className="panel-header">
      <div>
        <div className="panel-title">{title}</div>
        {subtitle ? <div className="panel-subtitle">{subtitle}</div> : null}
      </div>
      {action ? <div className="panel-action-wrap">{action}</div> : null}
    </div>
  );
}

interface PanelBodyProps {
  children: ReactNode;
  /** `tight` removes body padding — use when the child renders its own (e.g. a table). */
  tight?: boolean;
  className?: string;
}

export function PanelBody({ children, tight = false, className }: PanelBodyProps) {
  return <div className={cn('panel-body', tight && 'tight', className)}>{children}</div>;
}
