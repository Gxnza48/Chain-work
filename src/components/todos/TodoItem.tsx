import { useState } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { Calendar, Check, GripVertical, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { cn, initials } from '@/lib/utils';
import type { TodoRow, TodoStatus, UserRow } from '@/types';

interface Props {
  todo: TodoRow;
  members: UserRow[];
  draggable?: boolean;
  onChanged?: () => void;
}

export function TodoItem({ todo, members, draggable = false, onChanged }: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const sortable = useSortable({ id: todo.id, disabled: !draggable });

  const style: React.CSSProperties = draggable
    ? {
        transform: CSS.Translate.toString(sortable.transform),
        transition: sortable.transition,
        zIndex: sortable.isDragging ? 50 : undefined,
      }
    : {};

  const assignee = todo.assigned_to ? members.find((m) => m.id === todo.assigned_to) ?? null : null;

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
      toast.error('Could not update todo', { description: error.message });
      return;
    }
    onChanged?.();
  }

  async function deleteTodo() {
    if (todo.status === 'done') {
      toast.error('Completed todos cannot be deleted — re-open it first.');
      return;
    }
    if (!window.confirm('Delete this todo?')) return;
    setBusy(true);
    const { error } = await supabase.from('todos').delete().eq('id', todo.id);
    setBusy(false);
    if (error) {
      toast.error('Could not delete', { description: error.message });
      return;
    }
    onChanged?.();
  }

  return (
    <li
      ref={draggable ? sortable.setNodeRef : undefined}
      style={style}
      className={cn(
        'group flex items-start gap-3 rounded-md border-2 border-fg bg-surface p-3 shadow-brut-sm transition-shadow',
        sortable.isDragging && draggable ? 'ring-2 ring-accent-blue' : '',
      )}
    >
      {draggable ? (
        <button
          type="button"
          {...sortable.attributes}
          {...sortable.listeners}
          className="mt-1 cursor-grab rounded-md p-1 text-fg-muted opacity-60 hover:bg-surface-2 hover:opacity-100 active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      ) : null}

      <StatusButton status={todo.status} busy={busy} onCycle={cycleStatus} />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'font-semibold leading-snug text-fg break-words',
            todo.status === 'done' ? 'line-through opacity-60' : '',
          )}
        >
          {todo.title}
        </p>
        {todo.description ? (
          <p className="mt-0.5 whitespace-pre-wrap text-sm text-fg-muted">{todo.description}</p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {todo.status === 'in_progress' ? <Badge variant="amber">In progress</Badge> : null}
          {todo.status === 'done' ? <Badge variant="emerald">Done</Badge> : null}
          {todo.due_date ? (
            <Badge variant="neutral">
              <Calendar className="h-3 w-3" /> {new Date(todo.due_date).toLocaleDateString()}
            </Badge>
          ) : null}
          {assignee ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-fg-muted">
              <Avatar className="h-5 w-5">
                {assignee.avatar_url ? <AvatarImage src={assignee.avatar_url} alt={assignee.display_name} /> : null}
                <AvatarFallback className="text-[9px]">{initials(assignee.display_name)}</AvatarFallback>
              </Avatar>
              {assignee.display_name}
            </span>
          ) : null}
        </div>
      </div>

      {todo.status !== 'done' ? (
        <button
          type="button"
          onClick={deleteTodo}
          aria-label="Delete todo"
          className="rounded-md p-1 text-fg-muted opacity-0 transition-opacity hover:bg-accent-rose/10 hover:text-accent-rose group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => cycleStatus('pending')}
          aria-label="Re-open todo"
          className="rounded-md p-1 text-fg-muted opacity-0 transition-opacity hover:bg-surface-2 hover:text-fg group-hover:opacity-100"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}

interface StatusButtonProps {
  status: TodoStatus;
  busy: boolean;
  onCycle: (next: TodoStatus) => void;
}

function StatusButton({ status, busy, onCycle }: StatusButtonProps) {
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
      aria-label={`Mark as ${next}`}
      className={className}
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin text-fg" /> : <Check className="h-3 w-3" />}
    </button>
  );
}
