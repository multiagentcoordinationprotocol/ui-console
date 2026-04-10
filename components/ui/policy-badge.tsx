import { Badge } from '@/components/ui/badge';
import type { PolicyType } from '@/lib/types';

const policyTone: Record<string, string> = {
  none: 'neutral',
  majority: 'info',
  supermajority: 'warning',
  unanimous: 'danger'
};

export function PolicyBadge({ type }: { type?: PolicyType }) {
  if (!type) return null;
  const tone = (policyTone[type] ?? 'neutral') as 'neutral' | 'info' | 'warning' | 'danger' | 'success';
  return <Badge label={type} tone={tone} />;
}
