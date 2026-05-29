import { Flame, SignalHigh, SignalLow, SignalMedium, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { TodoPriority } from '@/types';

type BadgeVariant = 'neutral' | 'blue' | 'violet' | 'emerald' | 'amber' | 'rose';

interface PriorityMeta {
  label: string;
  variant: BadgeVariant;
  icon: LucideIcon;
  /** solid dot color class — used in pickers/menus */
  dot: string;
}

export const PRIORITY_ORDER: TodoPriority[] = ['low', 'medium', 'high', 'critical'];

export const PRIORITY_META: Record<TodoPriority, PriorityMeta> = {
  low: { label: 'Low', variant: 'emerald', icon: SignalLow, dot: 'bg-accent-emerald' },
  medium: { label: 'Medium', variant: 'blue', icon: SignalMedium, dot: 'bg-accent-blue' },
  high: { label: 'High', variant: 'amber', icon: SignalHigh, dot: 'bg-accent-amber' },
  critical: { label: 'Critical', variant: 'rose', icon: Flame, dot: 'bg-accent-rose' },
};

interface PriorityBadgeProps {
  priority: TodoPriority;
  className?: string;
}

/** Colored level badge for a todo, matching the app's brutalist Badge style. */
export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.medium;
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className={cn('shrink-0', className)}>
      <Icon className="h-3 w-3" strokeWidth={2.4} />
      {meta.label}
    </Badge>
  );
}
