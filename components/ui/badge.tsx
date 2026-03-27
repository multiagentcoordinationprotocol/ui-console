import { cn } from '@/lib/utils/cn';
import { getStatusTone, titleCase } from '@/lib/utils/format';

interface BadgeProps {
  label: string;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function Badge({ label, tone = 'neutral', className }: BadgeProps) {
  return <span className={cn('badge', `badge-${tone}`, className)}>{titleCase(label)}</span>;
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return <Badge label={status} tone={getStatusTone(status) as BadgeProps['tone']} className={className} />;
}
