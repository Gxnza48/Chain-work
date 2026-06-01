import { Check, Tag } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';
import { labelColorMeta } from './labelColors';
import { useT } from '@/lib/i18n';
import type { LabelRow } from '@/types';

interface Props {
  allLabels: LabelRow[];
  assignedIds: string[];
  onToggle: (labelId: string, on: boolean) => void;
  onManage: () => void;
}

export function TodoLabelPicker({ allLabels, assignedIds, onToggle, onManage }: Props) {
  const t = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={t('Edit labels')} className="rounded-md p-2 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg sm:p-1">
          <Tag className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {allLabels.length === 0 ? (
          <DropdownMenuItem onSelect={onManage}>{t('No labels yet — create one')}</DropdownMenuItem>
        ) : (
          allLabels.map((l) => {
            const on = assignedIds.includes(l.id);
            return (
              <DropdownMenuItem key={l.id} onSelect={(e) => { e.preventDefault(); onToggle(l.id, on); }}>
                <span className={cn('h-2.5 w-2.5 rounded-full border border-fg', labelColorMeta(l.color).dot)} />
                <span className="truncate">{l.name}</span>
                {on ? <Check className="ml-auto h-3.5 w-3.5" /> : null}
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onManage}>{t('Manage labels')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}