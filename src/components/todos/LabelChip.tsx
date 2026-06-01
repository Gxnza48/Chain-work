import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { labelColorMeta } from './labelColors';
import type { LabelRow } from '@/types';

interface Props {
  label: LabelRow;
  onRemove?: () => void;
  className?: string;
}

export function LabelChip({ label, onRemove, className }: Props) {
  const meta = labelColorMeta(label.color);
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-md border-2 border-fg px-2 py-0.5 text-xs font-bold uppercase tracking-wide font-mono shadow-brut-sm',
        meta.chip,
        className,
      )}
    >
      <span className="truncate">{label.name}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="-mr-0.5 rounded-sm p-0.5 hover:bg-black/20"
          aria-label={`Remove ${label.name}`}
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </span>
  );
}