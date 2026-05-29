import { cn } from '@/lib/utils';

interface Props {
  online: boolean;
  label?: string | null;
  size?: 'sm' | 'md';
}

export function PresenceBadge({ online, label, size = 'sm' }: Props) {
  const dot = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className={cn('rounded-full border border-fg/40', dot, online ? 'bg-accent-emerald' : 'bg-fg-muted')}
      />
      {label ? <span className="text-xs font-medium text-fg-muted">{label}</span> : null}
    </span>
  );
}
