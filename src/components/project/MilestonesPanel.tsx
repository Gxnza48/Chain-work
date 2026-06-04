import { useState } from 'react';
import { CheckCircle2, Flag, Pencil, Plus, RotateCcw, Target, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { MilestoneForm } from './MilestoneForm';
import { useMilestones } from '@/hooks/useMilestones';
import { cn, dueState } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import type { MilestoneWithProgress } from '@/types';

interface Props {
  chainId: string;
  projectId: string;
  /** Bump to force a reload (mirrors Roadmap/ProjectStats). */
  refreshSignal?: number;
  /** Milestone filter: the selected milestone id and a toggle callback. */
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
}

export function MilestonesPanel({ chainId, projectId, refreshSignal, selectedId, onSelect }: Props) {
  const t = useT();
  const { milestones, loading, reload } = useMilestones(projectId, refreshSignal);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function setStatus(m: MilestoneWithProgress, status: 'open' | 'done') {
    const { error } = await supabase.from('milestones').update({ status }).eq('id', m.id);
    if (error) {
      toast.error(t('Could not update milestone'), { description: error.message });
      return;
    }
    toast.success(status === 'done' ? t('Milestone completed') : t('Milestone re-opened'));
    reload();
  }

  async function remove(m: MilestoneWithProgress) {
    if (!window.confirm(t('Delete this milestone? Linked todos are kept.'))) return;
    const { error } = await supabase.from('milestones').delete().eq('id', m.id);
    if (error) {
      toast.error(t('Could not delete milestone'), { description: error.message });
      return;
    }
    toast.success(t('Milestone deleted'));
    reload();
  }

  return (
    <section className="rounded-lg border-2 border-fg bg-surface shadow-brut p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md border-2 border-fg bg-accent-violet text-white shadow-brut-sm">
            <Target className="h-4 w-4" />
          </span>
          <h3 className="font-display text-lg font-bold tracking-tight">{t('Milestones')}</h3>
          <span className="font-mono text-xs text-fg-muted">{t('goals & sprints')}</span>
        </div>
        {!adding ? (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="shrink-0">
            <Plus className="h-4 w-4" /> {t('New milestone')}
          </Button>
        ) : null}
      </div>

      {adding ? (
        <div className="mt-4">
          <MilestoneForm
            chainId={chainId}
            projectId={projectId}
            onCancel={() => setAdding(false)}
            onSaved={() => {
              setAdding(false);
              reload();
            }}
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3">
        {loading ? (
          <p className="text-sm text-fg-muted">{t('Loading…')}</p>
        ) : milestones.length === 0 ? (
          <p className="text-sm text-fg-muted">
            {t('No milestones yet. Group todos into a goal or sprint to track progress.')}
          </p>
        ) : (
          milestones.map((m) =>
            editingId === m.id ? (
              <MilestoneForm
                key={m.id}
                chainId={chainId}
                projectId={projectId}
                milestone={m}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  reload();
                }}
              />
            ) : (
              <MilestoneCard
                key={m.id}
                milestone={m}
                selected={selectedId === m.id}
                onSelect={onSelect ? () => onSelect(selectedId === m.id ? null : m.id) : undefined}
                onEdit={() => setEditingId(m.id)}
                onToggle={() => setStatus(m, m.status === 'done' ? 'open' : 'done')}
                onDelete={() => remove(m)}
              />
            ),
          )
        )}
      </div>
    </section>
  );
}

function MilestoneCard({
  milestone,
  selected,
  onSelect,
  onEdit,
  onToggle,
  onDelete,
}: {
  milestone: MilestoneWithProgress;
  selected?: boolean;
  onSelect?: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const done = milestone.status === 'done';
  const pct = milestone.total_todos === 0 ? 0 : Math.round((milestone.done_todos / milestone.total_todos) * 100);
  const due = !done ? dueState(milestone.due_date) : null;
  const dueVariant: 'rose' | 'amber' | 'neutral' =
    due?.state === 'overdue' ? 'rose' : due?.state === 'today' || due?.state === 'soon' ? 'amber' : 'neutral';

  return (
    <div
      className={cn(
        'group rounded-md border-2 border-fg bg-surface-2 p-3 transition-shadow',
        selected ? 'ring-2 ring-accent-violet' : '',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 border-fg text-white shadow-brut-sm',
            done ? 'bg-accent-emerald' : 'bg-surface text-fg',
          )}
        >
          <Flag className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {onSelect ? (
              <button
                type="button"
                onClick={onSelect}
                title={t('View only this milestone’s todos')}
                className={cn(
                  'break-words text-left font-bold text-fg underline-offset-2 hover:underline hover:decoration-dotted',
                  done ? 'line-through opacity-60' : '',
                )}
              >
                {milestone.title}
              </button>
            ) : (
              <p className={cn('font-bold text-fg break-words', done ? 'line-through opacity-60' : '')}>
                {milestone.title}
              </p>
            )}
            {done ? <Badge variant="emerald"><CheckCircle2 className="h-3 w-3" /> {t('Done')}</Badge> : null}
            {milestone.due_date ? (
              <Badge variant={dueVariant}>
                {new Date(`${milestone.due_date.slice(0, 10)}T00:00:00`).toLocaleDateString()}
                {due?.state === 'overdue' ? ` · ${t('overdue')}` : ''}
              </Badge>
            ) : null}
          </div>
          {milestone.description ? (
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-fg-muted">{milestone.description}</p>
          ) : null}
          <div className="mt-2 flex items-center gap-2">
            <Progress
              value={milestone.done_todos}
              max={Math.max(1, milestone.total_todos)}
              className="flex-1"
              barClassName={done ? 'bg-accent-emerald' : 'bg-accent-violet'}
            />
            <span className="shrink-0 font-mono text-xs text-fg-muted">
              {t('{done}/{total}', { done: milestone.done_todos, total: milestone.total_todos })} · {pct}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggle}
            aria-label={done ? t('Re-open milestone') : t('Mark milestone done')}
            title={done ? t('Re-open milestone') : t('Mark milestone done')}
            className="rounded-md p-2 text-fg-muted transition-colors hover:bg-surface hover:text-fg sm:p-1"
          >
            {done ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onEdit}
            aria-label={t('Edit milestone')}
            className="rounded-md p-2 text-fg-muted opacity-100 transition-opacity hover:bg-surface hover:text-fg sm:p-1 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={t('Delete milestone')}
            className="rounded-md p-2 text-fg-muted opacity-100 transition-opacity hover:bg-accent-rose/10 hover:text-accent-rose sm:p-1 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
