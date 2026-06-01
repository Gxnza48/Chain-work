import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import {
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ListTodo,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { TodoForm } from './TodoForm';
import { TodoItem } from './TodoItem';
import { PRIORITY_META, PRIORITY_ORDER } from './priority';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/ui';
import { cn, isTypingTarget } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import type { TodoPriority, TodoRow, UserRow } from '@/types';

type SortMode = 'manual' | 'priority' | 'due' | 'recent';

const PRIORITY_RANK: Record<TodoPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function sortList(list: TodoRow[], mode: SortMode): TodoRow[] {
  const arr = [...list];
  switch (mode) {
    case 'priority':
      return arr.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    case 'due':
      return arr.sort((a, b) => {
        const da = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY;
        const db = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY;
        return da - db;
      });
    case 'recent':
      return arr.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
    default:
      return arr;
  }
}

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
  const { user } = useAuth();
  const [todos, setTodos] = useState<TodoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Toolbar state
  const [query, setQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TodoPriority[]>([]);
  const [onlyMine, setOnlyMine] = useState(false);
  const [sort, setSort] = useLocalStorage<SortMode>('chainwork-todo-sort', 'manual');
  const [doneCollapsed, setDoneCollapsed] = useLocalStorage('chainwork-todos-done-collapsed', false);

  // Bulk selection
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const searchRef = useRef<HTMLInputElement | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function load() {
    setLoading(true);
    const query2 = supabase
      .from('todos')
      .select('*')
      .eq('chain_id', chainId)
      .order('status', { ascending: true })
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });
    if (projectId) query2.eq('project_id', projectId);
    else query2.is('project_id', null);
    const { data, error } = await query2;
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

  // Project-scoped hotkeys: "n" adds a todo, "/" focuses the search box.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target) || useUIStore.getState().paletteOpen) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setAdding(true);
      } else if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const me = user?.id ?? null;
  const q = query.trim().toLowerCase();
  const filtersActive = Boolean(q) || priorityFilter.length > 0 || onlyMine;

  function matches(todo: TodoRow): boolean {
    if (q && !`${todo.title} ${todo.description ?? ''}`.toLowerCase().includes(q)) return false;
    if (priorityFilter.length > 0 && !priorityFilter.includes(todo.priority)) return false;
    if (onlyMine) {
      const assigned = todo.assignees ?? (todo.assigned_to ? [todo.assigned_to] : []);
      if (!me || !assigned.includes(me)) return false;
    }
    return true;
  }

  const filtered = todos.filter(matches);
  const pending = sortList(filtered.filter((x) => x.status === 'pending'), sort);
  const inProgress = sortList(filtered.filter((x) => x.status === 'in_progress'), sort);
  const done = sortList(filtered.filter((x) => x.status === 'done'), sort);
  const anyVisible = pending.length + inProgress.length + done.length > 0;
  const canDrag = !filtersActive && sort === 'manual' && !selectionMode;

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pending.findIndex((x) => x.id === active.id);
    const newIndex = pending.findIndex((x) => x.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(pending, oldIndex, newIndex);
    const updated = todos.map((x) => {
      if (x.status !== 'pending') return x;
      const pos = reordered.findIndex((r) => r.id === x.id);
      return pos >= 0 ? { ...x, order_index: pos } : x;
    });
    setTodos(updated);
    await Promise.all(
      reordered.map((x, idx) => supabase.from('todos').update({ order_index: idx }).eq('id', x.id)),
    );
  }

  function togglePriorityFilter(p: TodoPriority) {
    setPriorityFilter((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  function clearFilters() {
    setQuery('');
    setPriorityFilter([]);
    setOnlyMine(false);
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelection() {
    setSelectionMode(false);
    setSelected(new Set());
  }

  async function runBulk(
    label: string,
    fn: () => PromiseLike<{ error: { message: string } | null }>,
  ) {
    const { error } = await fn();
    if (error) {
      toast.error(t('Bulk action failed'), { description: error.message });
      return;
    }
    toast.success(label);
    exitSelection();
    load();
  }

  const selectedIds = [...selected];

  async function bulkComplete() {
    if (!user || selectedIds.length === 0) return;
    await runBulk(t('Marked as done'), () =>
      supabase
        .from('todos')
        .update({ status: 'done', completed_at: new Date().toISOString(), completed_by: user.id })
        .in('id', selectedIds),
    );
  }

  async function bulkReopen() {
    if (selectedIds.length === 0) return;
    await runBulk(t('Re-opened'), () =>
      supabase
        .from('todos')
        .update({ status: 'pending', completed_at: null, completed_by: null })
        .in('id', selectedIds),
    );
  }

  async function bulkSetPriority(p: TodoPriority) {
    if (selectedIds.length === 0) return;
    await runBulk(t('Priority updated'), () =>
      supabase.from('todos').update({ priority: p }).in('id', selectedIds),
    );
  }

  async function bulkDelete() {
    // Mirror the single-item rule: completed todos feed the Roadmap, so they're
    // protected from deletion — skip them and tell the user.
    const deletable = todos.filter((x) => selected.has(x.id) && x.status !== 'done').map((x) => x.id);
    const skipped = selectedIds.length - deletable.length;
    if (deletable.length === 0) {
      toast.error(t('Completed todos cannot be deleted — re-open them first.'));
      return;
    }
    if (!window.confirm(t('Delete {n} todos?', { n: deletable.length }))) return;
    await runBulk(
      skipped > 0 ? t('Deleted ({n} completed skipped)', { n: skipped }) : t('Todos deleted'),
      () => supabase.from('todos').delete().in('id', deletable),
    );
  }

  const showToolbar = !loading && todos.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border-2 border-fg bg-accent-blue text-white shadow-brut-sm">
            <ListTodo className="h-4 w-4" />
          </span>
          <h3 className="truncate font-display text-lg font-bold tracking-tight">{t(heading)}</h3>
          <Badge variant="neutral" className="shrink-0">
            {t('{active} active · {done} done', {
              active: todos.filter((x) => x.status !== 'done').length,
              done: todos.filter((x) => x.status === 'done').length,
            })}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 border-fg bg-surface text-fg shadow-brut-sm"
            aria-label={t('Refresh')}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {!adding ? (
            <Button size="sm" onClick={() => setAdding(true)} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4" /> {t('Add todo')}
            </Button>
          ) : null}
        </div>
      </div>

      {showToolbar ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
              <Input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('Search todos…')}
                className="h-9 pl-9"
                aria-label={t('Search todos…')}
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
              <SelectTrigger className="h-9 w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">{t('Sort: Manual')}</SelectItem>
                <SelectItem value="priority">{t('Sort: Priority')}</SelectItem>
                <SelectItem value="due">{t('Sort: Due date')}</SelectItem>
                <SelectItem value="recent">{t('Sort: Newest')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant={selectionMode ? 'primary' : 'outline'}
              onClick={() => (selectionMode ? exitSelection() : setSelectionMode(true))}
              className="shrink-0"
            >
              <CheckSquare className="h-4 w-4" /> {t('Select')}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-fg-muted" />
            {PRIORITY_ORDER.map((p) => {
              const on = priorityFilter.includes(p);
              const meta = PRIORITY_META[p];
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePriorityFilter(p)}
                  aria-pressed={on}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border-2 border-fg px-2 py-0.5 text-xs font-bold shadow-brut-sm transition-colors',
                    on ? 'bg-fg text-bg' : 'bg-surface text-fg hover:bg-surface-2',
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full border border-fg', meta.dot)} />
                  {t(meta.label)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setOnlyMine((v) => !v)}
              aria-pressed={onlyMine}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border-2 border-fg px-2 py-0.5 text-xs font-bold shadow-brut-sm transition-colors',
                onlyMine ? 'bg-accent-blue text-white' : 'bg-surface text-fg hover:bg-surface-2',
              )}
            >
              {t('Only mine')}
            </button>
            {filtersActive ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold text-fg-muted hover:text-fg"
              >
                <X className="h-3.5 w-3.5" /> {t('Clear')}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {selectionMode ? (
        <div className="sticky top-16 z-10 flex flex-wrap items-center gap-2 rounded-lg border-2 border-fg bg-surface p-2 shadow-brut lg:top-2">
          <span className="px-1 text-sm font-bold">
            {t('{n} selected', { n: selected.size })}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="secondary" onClick={bulkComplete} disabled={selected.size === 0}>
              <Check className="h-4 w-4" /> {t('Complete')}
            </Button>
            <Button size="sm" variant="secondary" onClick={bulkReopen} disabled={selected.size === 0}>
              <RotateCcw className="h-4 w-4" /> {t('Reopen')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="secondary" disabled={selected.size === 0}>
                  <SlidersHorizontal className="h-4 w-4" /> {t('Priority')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {PRIORITY_ORDER.map((p) => (
                  <DropdownMenuItem key={p} onSelect={() => bulkSetPriority(p)}>
                    <span className={cn('h-2.5 w-2.5 rounded-full border border-fg', PRIORITY_META[p].dot)} />
                    {t(PRIORITY_META[p].label)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="danger" onClick={bulkDelete} disabled={selected.size === 0}>
              <Trash2 className="h-4 w-4" /> {t('Delete')}
            </Button>
            <Button size="sm" variant="ghost" onClick={exitSelection}>
              <X className="h-4 w-4" /> {t('Done')}
            </Button>
          </div>
        </div>
      ) : null}

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
      ) : !anyVisible ? (
        <div className="rounded-lg border-2 border-dashed border-fg bg-surface-2 p-8 text-center">
          <p className="font-semibold">{t('No todos match your filters.')}</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-1 text-sm font-semibold text-accent-blue hover:underline"
          >
            {t('Clear filters')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {pending.length > 0 ? (
            <section>
              <SectionHeader label={t('Pending')} count={pending.length} variant="neutral" />
              {canDrag ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={pending.map((x) => x.id)} strategy={verticalListSortingStrategy}>
                    <ul className="flex flex-col gap-2">
                      {pending.map((x) => (
                        <TodoItem key={x.id} todo={x} members={members} draggable onChanged={load} />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              ) : (
                <ul className="flex flex-col gap-2">
                  {pending.map((x) => (
                    <TodoItem
                      key={x.id}
                      todo={x}
                      members={members}
                      onChanged={load}
                      selectable={selectionMode}
                      selected={selected.has(x.id)}
                      onToggleSelected={() => toggleSelected(x.id)}
                    />
                  ))}
                </ul>
              )}
            </section>
          ) : null}

          {inProgress.length > 0 ? (
            <section>
              <SectionHeader label={t('In progress')} count={inProgress.length} variant="amber" />
              <ul className="flex flex-col gap-2">
                {inProgress.map((x) => (
                  <TodoItem
                    key={x.id}
                    todo={x}
                    members={members}
                    onChanged={load}
                    selectable={selectionMode}
                    selected={selected.has(x.id)}
                    onToggleSelected={() => toggleSelected(x.id)}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {done.length > 0 ? (
            <section>
              <button
                type="button"
                onClick={() => setDoneCollapsed((c) => !c)}
                className="mb-2 flex w-full items-center gap-2 text-left"
              >
                {doneCollapsed ? (
                  <ChevronRight className="h-3.5 w-3.5 text-fg-muted" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-fg-muted" />
                )}
                <h4 className="font-display text-xs font-bold uppercase tracking-[0.18em] text-fg-muted">
                  {t('Done (section)')}
                </h4>
                <Badge variant="emerald">{done.length}</Badge>
              </button>
              {!doneCollapsed ? (
                <ul className="flex flex-col gap-2">
                  {done.map((x) => (
                    <TodoItem
                      key={x.id}
                      todo={x}
                      members={members}
                      onChanged={load}
                      selectable={selectionMode}
                      selected={selected.has(x.id)}
                      onToggleSelected={() => toggleSelected(x.id)}
                    />
                  ))}
                </ul>
              ) : null}
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
