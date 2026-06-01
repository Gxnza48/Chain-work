import { useState } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import {
  Bell,
  Calendar,
  Check,
  Copy,
  CopyPlus,
  GripVertical,
  Loader2,
  MoreVertical,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { TodoForm } from './TodoForm';
import { PriorityBadge, PRIORITY_META, PRIORITY_ORDER } from './priority';
import { supabase } from '@/lib/supabase';
import { pingTodo } from '@/lib/push';
import { useAuth } from '@/hooks/useAuth';
import { useT, type TFn } from '@/lib/i18n';
import { cn, copyToClipboard, dueState, initials } from '@/lib/utils';
import type { TodoPriority, TodoRow, TodoStatus, UserRow } from '@/types';

const NUDGE_COOLDOWN_MS = 12 * 60 * 60 * 1000;

interface Props {
  todo: TodoRow;
  members: UserRow[];
  draggable?: boolean;
  onChanged?: () => void;
  /** Bulk-selection mode (renders a checkbox and hides the row actions). */
  selectable?: boolean;
  selected?: boolean;
  onToggleSelected?: () => void;
}

export function TodoItem({
  todo,
  members,
  draggable = false,
  onChanged,
  selectable = false,
  selected = false,
  onToggleSelected,
}: Props) {
  const { user } = useAuth();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nudging, setNudging] = useState(false);
  const canDrag = draggable && !selectable;
  const sortable = useSortable({ id: todo.id, disabled: !canDrag || editing });

  const style: React.CSSProperties = canDrag
    ? {
        transform: CSS.Translate.toString(sortable.transform),
        transition: sortable.transition,
        zIndex: sortable.isDragging ? 50 : undefined,
      }
    : {};

  const assignedIds = todo.assignees ?? (todo.assigned_to ? [todo.assigned_to] : []);
  const assignees = assignedIds
    .map((id) => members.find((m) => m.id === id))
    .filter((m): m is UserRow => Boolean(m));
  const isDone = todo.status === 'done';

  const nudgedAt = todo.last_nudged_at ? new Date(todo.last_nudged_at).getTime() : 0;
  const cooldownLeftMs = Math.max(0, nudgedAt + NUDGE_COOLDOWN_MS - Date.now());
  const onCooldown = cooldownLeftMs > 0;
  const cooldownHours = Math.ceil(cooldownLeftMs / (60 * 60 * 1000));

  // Due-date intelligence: overdue → rose, today/soon → amber.
  const due = !isDone ? dueState(todo.due_date) : null;
  const dueVariant: 'rose' | 'amber' | 'neutral' =
    due?.state === 'overdue' ? 'rose' : due?.state === 'today' || due?.state === 'soon' ? 'amber' : 'neutral';
  let dueSuffix = '';
  if (due?.state === 'overdue') dueSuffix = t('{n}d overdue', { n: Math.abs(due.days) });
  else if (due?.state === 'today') dueSuffix = t('today');
  else if (due?.state === 'soon') dueSuffix = t('in {n}d', { n: due.days });

  async function nudge() {
    if (nudging || onCooldown) return;
    setNudging(true);
    const r = await pingTodo(todo.id);
    setNudging(false);
    if (r.ok) {
      toast.success(t('Reminder sent'));
      onChanged?.();
    } else if (r.status === 429) {
      toast.error(t('Already reminded recently'), {
        description: t('Available in {h}h', { h: Math.max(1, Math.ceil((r.retryAfter ?? 0) / 3600)) }),
      });
      onChanged?.();
    } else if (r.error === 'no-assignees') {
      toast.error(t('No one is assigned to this todo'));
    } else {
      toast.error(t('Could not send reminder'), { description: r.error });
    }
  }

  async function cycleStatus(next: TodoStatus) {
    if (!user) return;
    setBusy(true);
    const payload: Partial<TodoRow> =
      next === 'done'
        ? { status: 'done', completed_at: new Date().toISOString(), completed_by: user.id }
        : { status: next, completed_at: null, completed_by: null };
    const { error } = await supabase.from('todos').update(payload).eq('id', todo.id);
    setBusy(false);
    if (error) {
      toast.error(t('Could not update todo'), { description: error.message });
      return;
    }
    onChanged?.();
  }

  async function changePriority(p: TodoPriority) {
    if (p === todo.priority) return;
    setBusy(true);
    const { error } = await supabase.from('todos').update({ priority: p }).eq('id', todo.id);
    setBusy(false);
    if (error) {
      toast.error(t('Could not update priority'), { description: error.message });
      return;
    }
    onChanged?.();
  }

  async function deleteTodo() {
    if (isDone) {
      toast.error(t('Completed todos cannot be deleted — re-open it first.'));
      return;
    }
    if (!window.confirm(t('Delete this todo?'))) return;
    setBusy(true);
    const { error } = await supabase.from('todos').delete().eq('id', todo.id);
    setBusy(false);
    if (error) {
      toast.error(t('Could not delete'), { description: error.message });
      return;
    }
    onChanged?.();
  }

  async function duplicate() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from('todos').insert({
      chain_id: todo.chain_id,
      project_id: todo.project_id,
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      assignees: todo.assignees ?? [],
      assigned_to: todo.assigned_to,
      due_date: todo.due_date,
      created_by: user.id,
    });
    setBusy(false);
    if (error) {
      toast.error(t('Could not duplicate'), { description: error.message });
      return;
    }
    toast.success(t('Todo duplicated'));
    onChanged?.();
  }

  async function copyTitle() {
    const ok = await copyToClipboard(todo.title);
    if (ok) toast.success(t('Copied to clipboard'));
  }

  if (editing) {
    return (
      <li>
        <TodoForm
          chainId={todo.chain_id}
          projectId={todo.project_id}
          members={members}
          todo={todo}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            onChanged?.();
          }}
        />
      </li>
    );
  }

  return (
    <li
      ref={canDrag ? sortable.setNodeRef : undefined}
      style={style}
      className={cn(
        'group flex items-start gap-3 rounded-md border-2 border-fg bg-surface p-3 shadow-brut-sm transition-shadow',
        sortable.isDragging && canDrag ? 'ring-2 ring-accent-blue' : '',
        selectable && selected ? 'ring-2 ring-accent-blue' : '',
      )}
    >
      {selectable ? (
        <button
          type="button"
          onClick={onToggleSelected}
          role="checkbox"
          aria-checked={selected}
          aria-label={t('Select todo')}
          className={cn(
            'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 border-fg shadow-brut-sm transition-colors',
            selected ? 'bg-accent-blue text-white' : 'bg-surface text-transparent hover:bg-surface-2',
          )}
        >
          <Check className="h-4 w-4" />
        </button>
      ) : (
        <>
          {canDrag ? (
            <button
              type="button"
              {...sortable.attributes}
              {...sortable.listeners}
              className="mt-1 cursor-grab rounded-md p-1 text-fg-muted opacity-60 hover:bg-surface-2 hover:opacity-100 active:cursor-grabbing"
              aria-label={t('Drag to reorder')}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          ) : null}
          <StatusButton status={todo.status} busy={busy} onCycle={cycleStatus} t={t} />
        </>
      )}

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'font-semibold leading-snug text-fg break-words',
            isDone ? 'line-through opacity-60' : '',
          )}
        >
          {todo.title}
        </p>
        {todo.description ? (
          <p className="mt-0.5 whitespace-pre-wrap text-sm text-fg-muted">{todo.description}</p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {/* Priority badge doubles as a quick picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t('Priority: {label} — click to change', {
                  label: t(PRIORITY_META[todo.priority]?.label ?? 'Medium'),
                })}
                className="rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
              >
                <PriorityBadge priority={todo.priority} className="cursor-pointer transition-opacity hover:opacity-80" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {PRIORITY_ORDER.map((p) => (
                <DropdownMenuItem key={p} onSelect={() => changePriority(p)}>
                  <span className={cn('h-2.5 w-2.5 rounded-full border border-fg', PRIORITY_META[p].dot)} />
                  {t(PRIORITY_META[p].label)}
                  {p === todo.priority ? <Check className="ml-auto h-3.5 w-3.5" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {todo.status === 'in_progress' ? <Badge variant="amber">{t('In progress')}</Badge> : null}
          {isDone ? <Badge variant="emerald">{t('Done')}</Badge> : null}
          {todo.due_date ? (
            <Badge variant={dueVariant}>
              <Calendar className="h-3 w-3" />
              {new Date(`${todo.due_date.slice(0, 10)}T00:00:00`).toLocaleDateString()}
              {dueSuffix ? ` · ${dueSuffix}` : ''}
            </Badge>
          ) : null}
          {assignees.length > 0 ? (
            <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-xs font-semibold text-fg-muted">
              <span className="flex shrink-0 -space-x-1.5">
                {assignees.slice(0, 4).map((a) => (
                  <Avatar key={a.id} className="h-5 w-5 ring-2 ring-surface">
                    {a.avatar_url ? <AvatarImage src={a.avatar_url} alt={a.display_name} /> : null}
                    <AvatarFallback className="text-[9px]">{initials(a.display_name)}</AvatarFallback>
                  </Avatar>
                ))}
              </span>
              <span className="truncate">
                {assignees.length === 1 ? assignees[0].display_name : t('{n} assigned', { n: assignees.length })}
              </span>
            </span>
          ) : null}
        </div>
      </div>

      {!selectable ? (
        <div className="flex items-center gap-1">
          {!isDone && assignees.length > 0 ? (
            <button
              type="button"
              onClick={nudge}
              disabled={nudging || onCooldown}
              aria-label={t('Remind assignees')}
              title={onCooldown ? t('Available in {h}h', { h: cooldownHours }) : t('Remind assignees')}
              className={cn(
                'rounded-md p-1 transition-colors',
                onCooldown
                  ? 'cursor-not-allowed text-fg-muted/40'
                  : 'text-accent-amber hover:bg-accent-amber/10',
              )}
            >
              {nudging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            </button>
          ) : null}
          {!isDone ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={t('Edit todo')}
              className="rounded-md p-2 text-fg-muted opacity-100 transition-opacity hover:bg-surface-2 hover:text-fg sm:p-1 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <Pencil className="h-4 w-4" />
            </button>
          ) : null}
          {!isDone ? (
            <button
              type="button"
              onClick={deleteTodo}
              aria-label={t('Delete todo')}
              className="rounded-md p-2 text-fg-muted opacity-100 transition-opacity hover:bg-accent-rose/10 hover:text-accent-rose sm:p-1 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => cycleStatus('pending')}
              aria-label={t('Re-open todo')}
              className="rounded-md p-2 text-fg-muted opacity-100 transition-opacity hover:bg-surface-2 hover:text-fg sm:p-1 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t('More actions')}
                className="rounded-md p-2 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg sm:p-1"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={duplicate}>
                <CopyPlus className="h-4 w-4" />
                {t('Duplicate')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={copyTitle}>
                <Copy className="h-4 w-4" />
                {t('Copy title')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </li>
  );
}

interface StatusButtonProps {
  status: TodoStatus;
  busy: boolean;
  onCycle: (next: TodoStatus) => void;
  t: TFn;
}

const STATUS_LABEL: Record<TodoStatus, string> = {
  pending: 'pending',
  in_progress: 'in progress',
  done: 'done',
};

function StatusButton({ status, busy, onCycle, t }: StatusButtonProps) {
  const next: TodoStatus = status === 'pending' ? 'in_progress' : status === 'in_progress' ? 'done' : 'pending';

  const className = cn(
    'mt-0.5 inline-grid h-6 w-6 place-items-center rounded-full border-2 border-fg text-white shadow-brut-sm shrink-0',
    status === 'pending' ? 'bg-surface-2 text-transparent' : '',
    status === 'in_progress' ? 'bg-accent-amber' : '',
    status === 'done' ? 'bg-accent-emerald' : '',
  );

  return (
    <button
      type="button"
      onClick={() => onCycle(next)}
      disabled={busy}
      aria-label={t('Mark as {status}', { status: t(STATUS_LABEL[next]) })}
      className={className}
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin text-fg" /> : <Check className="h-3 w-3" />}
    </button>
  );
}
