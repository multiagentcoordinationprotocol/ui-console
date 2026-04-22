import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * EmptyState — R4.7.
 *
 * Standardized empty state replacing the ~5 hand-rolled variants across
 * the app (observability partial-load banner, no-runs placeholder, node
 * inspector "select a node", signal rail "no signals", etc.).
 *
 * Shape: icon + title + optional description + optional action.
 *
 * Usage:
 *   <EmptyState
 *     icon={<Inbox size={20} />}
 *     title="No runs yet"
 *     description="Launch a scenario from the catalog to see it here."
 *     action={<Link href="/runs/new" className="button button-primary">Launch</Link>}
 *   />
 */
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** Uses a tighter layout intended for in-panel empties. */
  compact?: boolean;
  className?: string;
}

export function EmptyState({ icon, title, description, action, compact = false, className }: EmptyStateProps) {
  return (
    <div className={cn('empty-state', compact && 'compact', className)}>
      {icon ? <div className="empty-state-icon">{icon}</div> : null}
      <h4>{title}</h4>
      {description ? <p>{description}</p> : null}
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
