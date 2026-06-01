import { useState } from 'react';
import { Check, Loader2, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { useSubtasks } from './useSubtasks';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface Props {
  todoId: string;
  chainId: string;
}

export function SubtaskList({ todoId, chainId }: Props) {
  const t = useT();
  const { items, loading, total, completed, add, toggle, remove } = useSubtasks(todoId, chainId);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    await add(title);
    setSaving(false);
    setTitle('');
  }

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-md border-2 border-fg bg-surface-2 p-3">
      {total > 0 ? (
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-xs font-bold tabular-nums text-fg-muted">
            {completed}/{total}
          </span>
          <Progress
            value={completed}
            max={total}
            className="h-2 flex-1"
            barClassName={completed === total ? 'bg-accent-emerald' : 'bg-accent-blue'}
          />
        </div>
      ) : null}

      {loading ? (
        <p className="text-xs text-fg-muted">{t('Loading…')}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((s) => (
            <li key={s.id} className="group/sub flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggle(s.id, !s.done)}
                role="checkbox"
                aria-checked={s.done}
                aria-label={s.done ? t('Mark subtask not done') : t('Mark subtask done')}
                className={cn(
                  'grid h-5 w-5 shrink-0 place-items-center rounded border-2 border-fg shadow-brut-sm transition-colors',
                  s.done ? 'bg-accent-emerald text-white' : 'bg-surface text-transparent hover:bg-surface',
                )}
              >
                <Check className="h-3 w-3" />
              </button>
              <span
                className={cn(
                  'min-w-0 flex-1 break-words text-sm text-fg',
                  s.done ? 'line-through opacity-60' : '',
                )}
              >
                {s.title}
              </span>
              <button
                type="button"
                onClick={() => remove(s.id)}
                aria-label={t('Delete subtask')}
                className="rounded p-1 text-fg-muted opacity-100 transition-opacity hover:bg-accent-rose/10 hover:text-accent-rose sm:opacity-0 sm:group-hover/sub:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onAdd} className="flex items-center gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('Add a subtask…')}
          aria-label={t('Add a subtask…')}
          className="h-9 text-sm"
        />
        <Button type="submit" size="sm" variant="outline" disabled={!title.trim() || saving} className="shrink-0">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span className="hidden sm:inline">{t('Add')}</span>
        </Button>
        {title ? (
          <button
            type="button"
            onClick={() => setTitle('')}
            aria-label={t('Clear')}
            className="rounded-md p-1 text-fg-muted hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </form>
    </div>
  );
}
