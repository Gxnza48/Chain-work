import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { ListTodo, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TodoForm } from './TodoForm';
import { TodoItem } from './TodoItem';
import { useT } from '@/lib/i18n';
import type { TodoRow, UserRow } from '@/types';

interface Props {
  chainId: string;
  projectId?: string | null;
  members: UserRow[];
  heading?: string;
  /** Called whenever the todo set is (re)loaded — lets a sibling Roadmap refresh. */
  onChanged?: () => void;
}

export function TodoList({ chainId, projectId, members, heading = 'Todos', onChanged }: Props) {
  const t = useT();
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function load() {
    setLoading(true);
    const query = supabase
      .from('todos')
      .select('*')
      .eq('chain_id', chainId)
      .order('status', { ascending: true })
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });
    if (projectId) query.eq('project_id', projectId);
    else query.is('project_id', null);
    const { data, error } = await query;
    if (error) {
      toast.error(t('Could not load todos'), { description: error.message });
      setTodos([]);
    } else {
      setTodos(data ?? []);
    }
    setLoading(false);
    onChanged?.();
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`todos:${chainId}:${projectId ?? 'chain'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos', filter: `chain_id=eq.${chainId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, projectId]);

  const pending = useMemo(() => todos.filter((t) => t.status === 'pending'), [todos]);
  const inProgress = useMemo(() => todos.filter((t) => t.status === 'in_progress'), [todos]);
  const done = useMemo(() => todos.filter((t) => t.status === 'done'), [todos]);

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pending.findIndex((t) => t.id === active.id);
    const newIndex = pending.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(pending, oldIndex, newIndex);

    // optimistic: rewrite order_index ascending, keep other statuses untouched
    const updated = todos.map((t) => {
      if (t.status !== 'pending') return t;
      const pos = reordered.findIndex((x) => x.id === t.id);
      return { ...t, order_index: pos };
    });
    setTodos(updated);

    await Promise.all(
      reordered.map((t, idx) =>
        supabase.from('todos').update({ order_index: idx }).eq('id', t.id),
      ),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md border-2 border-fg bg-accent-blue text-white shadow-brut-sm">
            <ListTodo className="h-4 w-4" />
          </span>
          <h3 className="font-display text-lg font-bold tracking-tight">{t(heading)}</h3>
          <Badge variant="neutral">
            {t('{active} active · {done} done', {
              active: pending.length + inProgress.length,
              done: done.length,
            })}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-grid h-9 w-9 place-items-center rounded-md border-2 border-fg bg-surface text-fg shadow-brut-sm"
            aria-label={t('Refresh')}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {!adding ? (
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> {t('Add todo')}
            </Button>
          ) : null}
        </div>
      </div>

      {adding ? (
        <TodoForm
          chainId={chainId}
          projectId={projectId}
          members={members}
          onCancel={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            load();
          }}
        />
      ) : null}

      {loading ? (
        <p className="text-sm text-fg-muted">{t('Loading…')}</p>
      ) : todos.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-fg bg-surface-2 p-8 text-center">
          <p className="font-semibold">{t('No todos here yet.')}</p>
          <p className="mt-1 text-sm text-fg-muted">{t('Add the first one to kick this off.')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {pending.length > 0 ? (
            <section>
              <SectionHeader label={t('Pending')} count={pending.length} variant="neutral" />
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={pending.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <ul className="flex flex-col gap-2">
                    {pending.map((t) => (
                      <TodoItem
                        key={t.id}
                        todo={t}
                        members={members}
                        draggable
                        onChanged={load}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            </section>
          ) : null}

          {inProgress.length > 0 ? (
            <section>
              <SectionHeader label={t('In progress')} count={inProgress.length} variant="amber" />
              <ul className="flex flex-col gap-2">
                {inProgress.map((t) => (
                  <TodoItem key={t.id} todo={t} members={members} onChanged={load} />
                ))}
              </ul>
            </section>
          ) : null}

          {done.length > 0 ? (
            <section>
              <SectionHeader label={t('Done (section)')} count={done.length} variant="emerald" />
              <ul className="flex flex-col gap-2">
                {done.map((t) => (
                  <TodoItem key={t.id} todo={t} members={members} onChanged={load} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  label,
  count,
  variant,
}: {
  label: string;
  count: number;
  variant: 'neutral' | 'amber' | 'emerald';
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <h4 className="font-display text-xs font-bold uppercase tracking-[0.18em] text-fg-muted">{label}</h4>
      <Badge variant={variant}>{count}</Badge>
    </div>
  );
}
