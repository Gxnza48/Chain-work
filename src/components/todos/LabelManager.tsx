import { useState } from 'react';
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { LabelChip } from './LabelChip';
import { LABEL_COLOR_ORDER, LABEL_COLORS } from './labelColors';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import type { LabelColor, LabelRow } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  labels: LabelRow[];
  createLabel: (name: string, color: LabelColor) => PromiseLike<{ error: { message: string; code?: string } | null }>;
  renameLabel: (id: string, name: string) => PromiseLike<{ error: { message: string } | null }>;
  recolorLabel: (id: string, color: LabelColor) => PromiseLike<{ error: { message: string } | null }>;
  deleteLabel: (id: string) => PromiseLike<{ error: { message: string } | null }>;
}

function ColorPicker({ value, onPick }: { value: string; onPick: (c: LabelColor) => void }) {
  const t = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('Pick a color')}
          className={cn('h-7 w-7 shrink-0 rounded-md border-2 border-fg shadow-brut-sm', LABEL_COLORS[(value as LabelColor)]?.dot ?? LABEL_COLORS.blue.dot)}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {LABEL_COLOR_ORDER.map((c) => (
          <DropdownMenuItem key={c} onSelect={() => onPick(c)}>
            <span className={cn('h-3.5 w-3.5 rounded-full border border-fg', LABEL_COLORS[c].dot)} />
            {t(c)}
            {c === value ? <Check className="ml-auto h-3.5 w-3.5" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LabelManager({ open, onOpenChange, labels, createLabel, renameLabel, recolorLabel, deleteLabel }: Props) {
  const t = useT();
  const [name, setName] = useState('');
  const [color, setColor] = useState<LabelColor>('blue');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    const { error } = await createLabel(name, color);
    setBusy(false);
    if (error) {
      toast.error(error.code === '23505' ? t('A label with that name already exists') : t('Could not create label'), {
        description: error.code === '23505' ? undefined : error.message,
      });
      return;
    }
    setName('');
  }

  async function saveRename(id: string) {
    if (!editName.trim()) { setEditingId(null); return; }
    const { error } = await renameLabel(id, editName);
    if (error) toast.error(t('Could not rename label'), { description: error.message });
    setEditingId(null);
  }

  async function remove(id: string) {
    if (!window.confirm(t('Delete this label? It will be removed from all todos.'))) return;
    const { error } = await deleteLabel(id);
    if (error) toast.error(t('Could not delete label'), { description: error.message });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Manage labels')}</DialogTitle>
        </DialogHeader>

        <div className="flex items-end gap-2">
          <ColorPicker value={color} onPick={setColor} />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void add(); } }}
            placeholder={t('New label name')}
            className="h-9 flex-1"
          />
          <Button size="sm" onClick={add} disabled={busy || !name.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('Add')}
          </Button>
        </div>

        <ul className="mt-3 flex max-h-80 flex-col gap-2 overflow-y-auto">
          {labels.length === 0 ? (
            <li className="rounded-md border-2 border-dashed border-fg bg-surface-2 p-4 text-center text-sm text-fg-muted">
              {t('No labels yet. Create your first one above.')}
            </li>
          ) : labels.map((l) => (
            <li key={l.id} className="flex items-center gap-2 rounded-md border-2 border-fg bg-surface p-2 shadow-brut-sm">
              <ColorPicker value={l.color} onPick={(c) => recolorLabel(l.id, c)} />
              {editingId === l.id ? (
                <Input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => saveRename(l.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void saveRename(l.id); } if (e.key === 'Escape') setEditingId(null); }}
                  className="h-8 flex-1"
                />
              ) : (
                <span className="min-w-0 flex-1"><LabelChip label={l} /></span>
              )}
              <button type="button" aria-label={t('Rename')} onClick={() => { setEditingId(l.id); setEditName(l.name); }} className="rounded-md p-1 text-fg-muted hover:bg-surface-2 hover:text-fg">
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" aria-label={t('Delete')} onClick={() => remove(l.id)} className="rounded-md p-1 text-fg-muted hover:bg-accent-rose/10 hover:text-accent-rose">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-2 flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}><X className="h-4 w-4" /> {t('Close')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}