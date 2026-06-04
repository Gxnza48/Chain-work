import { useState } from 'react';
import { Calendar, Check, Pencil, Target, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { TodoForm } from './TodoForm';
import { TodoAttachments } from './TodoAttachments';
import { SubtaskList } from './SubtaskList';
import { CommentThread } from './CommentThread';
import { LabelChip } from './LabelChip';
import { TodoLabelPicker } from './TodoLabelPicker';
import { PriorityBadge, PRIORITY_META, PRIORITY_ORDER } from './priority';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/lib/i18n';
import { cn, dueState, initials } from '@/lib/utils';
import type { LabelRow, TodoRow, TodoStatus, UserRow } from '@/types';

interface Props {
  todo: TodoRow;
  members: UserRow[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onChanged?: () => void;
  allLabels?: LabelRow[];
  todoLabels?: LabelRow[];
  onToggleLabel?: (labelId: string, on: boolean) => void;
  onManageLabels?: () => void;
  milestoneTitle?: string;
}

const STATUS_ORDER: TodoStatus[] = ['pending', 'in_progress', 'done'];
const STATUS_LABEL: Record<TodoStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  done: 'Done',
};

export function TodoDetailModal({
  todo,
  members,
  open,
  onOpenChange,
  onChanged,
  allLabels,
  todoLabels,
  onToggleLabel,
  onManageLabels,
  milestoneTitle,
}: Props) {
  const { user } = useAuth();
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const isDone = todo.status === 'done';
  const assignedIds = todo.assignees ?? (todo.assigned_to ? [todo.assigned_to] : []);
  const due = !isDone ? dueState(todo.due_date) : null;
  const dueVariant: 'rose' | 'amber' | 'neutral' =
    due?.state === 'overdue' ? 'rose' : due?.state === 'today' || due?.state === 'soon' ? 'amber' : 'neutral';

  async function update(payload: Partial<TodoRow>, errorKey: string) {
    setBusy(true);
    const { error } = await supabase.from('todos').update(payload).eq('id', todo.id);
    setBusy(false);
    if (error) {
      toast.error(t(errorKey), { description: error.message });
      return;
    }
    onChanged?.();
  }

  function setStatus(next: TodoStatus) {
    if (next === todo.status || !user) return;
    void update(
      next === 'done'
        ? { status: 'done', completed_at: new Date().toISOString(), completed_by: user.id }
        : { status: next, completed_at: null, completed_by: null },
      'Could not update todo',
    );
  }

  function toggleAssignee(id: string) {
    const next = assignedIds.includes(id) ? assignedIds.filter((x) => x !== id) : [...assignedIds, id];
    void update({ assignees: next, assigned_to: next[0] ?? null }, 'Could not update todo');
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
    onOpenChange(false);
    onChanged?.();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setEditing(false); onOpenChange(o); }}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className={cn('pr-8 break-words', isDone ? 'line-through opacity-60' : '')}>
            {todo.title}
          </DialogTitle>
        </DialogHeader>

        {editing ? (
          <TodoForm
            chainId={todo.chain_id}
            projectId={todo.project_id}
            members={members}
            todo={todo}
            allLabels={allLabels}
            initialLabelIds={(todoLabels ?? []).map((l) => l.id)}
            onManageLabels={onManageLabels}
            onCancel={() => setEditing(false)}
            onSaved={() => {
              setEditing(false);
              onChanged?.();
            }}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {/* Status switcher */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-fg-muted">{t('Status')}</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_ORDER.map((s) => {
                  const on = todo.status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={busy}
                      onClick={() => setStatus(s)}
                      aria-pressed={on}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border-2 border-fg px-3 py-1.5 text-sm font-bold shadow-brut-sm transition-colors',
                        on
                          ? s === 'done'
                            ? 'bg-accent-emerald text-white'
                            : s === 'in_progress'
                              ? 'bg-accent-amber text-white'
                              : 'bg-fg text-bg'
                          : 'bg-surface text-fg hover:bg-surface-2',
                      )}
                    >
                      {on ? <Check className="h-3.5 w-3.5" /> : null}
                      {t(STATUS_LABEL[s])}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority + due */}
            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label={t('Priority')} className="rounded-md">
                    <PriorityBadge priority={todo.priority} className="cursor-pointer hover:opacity-80" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {PRIORITY_ORDER.map((p) => (
                    <DropdownMenuItem
                      key={p}
                      onSelect={() => p !== todo.priority && void update({ priority: p }, 'Could not update priority')}
                    >
                      <span className={cn('h-2.5 w-2.5 rounded-full border border-fg', PRIORITY_META[p].dot)} />
                      {t(PRIORITY_META[p].label)}
                      {p === todo.priority ? <Check className="ml-auto h-3.5 w-3.5" /> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {todo.due_date ? (
                <Badge variant={dueVariant}>
                  <Calendar className="h-3 w-3" />
                  {new Date(`${todo.due_date.slice(0, 10)}T00:00:00`).toLocaleDateString()}
                </Badge>
              ) : null}
              {todo.milestone_id && milestoneTitle ? (
                <Badge variant="violet">
                  <Target className="h-3 w-3" />
                  {milestoneTitle}
                </Badge>
              ) : null}
            </div>

            {/* Assignees */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-fg-muted">{t('Assignees')}</p>
              {members.length === 0 ? (
                <p className="text-xs text-fg-muted">{t('No members to assign yet.')}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    const on = assignedIds.includes(m.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        disabled={busy}
                        onClick={() => toggleAssignee(m.id)}
                        aria-pressed={on}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-md border-2 border-fg px-2 py-1 text-xs font-bold shadow-brut-sm transition-colors',
                          on ? 'bg-accent-blue text-white' : 'bg-surface text-fg hover:bg-surface-2',
                        )}
                      >
                        <Avatar className="h-4 w-4">
                          {m.avatar_url ? <AvatarImage src={m.avatar_url} alt={m.display_name} /> : null}
                          <AvatarFallback className="text-[8px]">{initials(m.display_name)}</AvatarFallback>
                        </Avatar>
                        {m.display_name}
                        {on ? <Check className="h-3 w-3" /> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Labels */}
            {allLabels ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-fg-muted">{t('Labels')}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(todoLabels ?? []).map((l) => (
                    <LabelChip key={l.id} label={l} onRemove={!isDone ? () => onToggleLabel?.(l.id, true) : undefined} />
                  ))}
                  {!isDone ? (
                    <TodoLabelPicker
                      allLabels={allLabels}
                      assignedIds={(todoLabels ?? []).map((l) => l.id)}
                      onToggle={(lid, on) => onToggleLabel?.(lid, on)}
                      onManage={() => onManageLabels?.()}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-fg-muted">{t('Description')}</p>
              {todo.description ? (
                <p className="whitespace-pre-wrap break-words text-sm text-fg">{todo.description}</p>
              ) : (
                <p className="text-sm italic text-fg-muted">{t('No description')}</p>
              )}
            </div>

            {/* Attachments */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-fg-muted">{t('Attachments')}</p>
              <TodoAttachments todoId={todo.id} chainId={todo.chain_id} readOnly={isDone} />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 border-t-2 border-dashed border-fg/20 pt-3">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" /> {t('Edit details')}
              </Button>
              {!isDone ? (
                <Button size="sm" variant="danger" onClick={deleteTodo} disabled={busy}>
                  <Trash2 className="h-4 w-4" /> {t('Delete')}
                </Button>
              ) : null}
            </div>

            {/* Subtasks + comments */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-fg-muted">{t('Subtasks')}</p>
              <SubtaskList todoId={todo.id} chainId={todo.chain_id} />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-fg-muted">{t('Comments')}</p>
              <CommentThread chainId={todo.chain_id} todoId={todo.id} members={members} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
