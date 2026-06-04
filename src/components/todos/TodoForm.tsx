import { useState } from 'react';
import { Check, Loader2, Plus, Save, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { PRIORITY_META, PRIORITY_ORDER } from './priority';
import { labelColorMeta } from './labelColors';
import { supabase } from '@/lib/supabase';
import { notifyEvent } from '@/lib/push';
import { useAuth } from '@/hooks/useAuth';
import { useMilestones } from '@/hooks/useMilestones';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { LabelRow, TodoPriority, TodoRow, UserRow } from '@/types';

interface Props {
  chainId: string;
  projectId?: string | null;
  members: UserRow[];
  /** When provided, the form edits this todo instead of creating a new one. */
  todo?: TodoRow;
  /** Labels feature: the chain's labels + this todo's current label ids. */
  allLabels?: LabelRow[];
  initialLabelIds?: string[];
  onManageLabels?: () => void;
  onCreated?: () => void;
  onSaved?: () => void;
  onCancel?: () => void;
}

export function TodoForm({
  chainId,
  projectId,
  members,
  todo,
  allLabels,
  initialLabelIds,
  onManageLabels,
  onCreated,
  onSaved,
  onCancel,
}: Props) {
  const { user } = useAuth();
  const t = useT();
  const editing = Boolean(todo);
  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const [assignees, setAssignees] = useState<string[]>(
    todo?.assignees ?? (todo?.assigned_to ? [todo.assigned_to] : []),
  );
  const [dueDate, setDueDate] = useState(todo?.due_date ?? '');
  const [milestoneId, setMilestoneId] = useState(todo?.milestone_id ?? '');
  const [labelIds, setLabelIds] = useState<string[]>(initialLabelIds ?? []);
  const { milestones } = useMilestones(projectId ?? '');

  function toggleAssignee(id: string) {
    setAssignees((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleLabel(id: string) {
    setLabelIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  const [priority, setPriority] = useState<TodoPriority>(todo?.priority ?? 'medium');
  const [submitting, setSubmitting] = useState(false);

  // Reconcile the todo_labels junction against the picked label ids.
  async function syncLabels(todoId: string) {
    const initial = initialLabelIds ?? [];
    const toAdd = labelIds.filter((id) => !initial.includes(id));
    const toRemove = initial.filter((id) => !labelIds.includes(id));
    await Promise.all([
      toAdd.length
        ? supabase.from('todo_labels').insert(toAdd.map((label_id) => ({ todo_id: todoId, label_id })))
        : Promise.resolve(),
      toRemove.length
        ? supabase.from('todo_labels').delete().eq('todo_id', todoId).in('label_id', toRemove)
        : Promise.resolve(),
    ]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) {
      toast.error(t('Give the todo a title'));
      return;
    }
    setSubmitting(true);

    if (editing && todo) {
      const { error } = await supabase
        .from('todos')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          assignees,
          assigned_to: assignees[0] ?? null,
          due_date: dueDate || null,
          milestone_id: milestoneId || null,
          priority,
        })
        .eq('id', todo.id);
      if (!error) await syncLabels(todo.id);
      setSubmitting(false);
      if (error) {
        toast.error(t('Could not save todo'), { description: error.message });
        return;
      }
      toast.success(t('Todo updated'));
      onSaved?.();
      return;
    }

    const { data, error } = await supabase
      .from('todos')
      .insert({
        chain_id: chainId,
        project_id: projectId ?? null,
        title: title.trim(),
        description: description.trim() || null,
        assignees,
        assigned_to: assignees[0] ?? null,
        due_date: dueDate || null,
        milestone_id: milestoneId || null,
        priority,
        created_by: user.id,
      })
      .select('id')
      .single();
    if (data && labelIds.length) await syncLabels(data.id);
    setSubmitting(false);
    if (error) {
      toast.error(t('Could not create todo'), { description: error.message });
      return;
    }
    if (data) void notifyEvent('todo', { id: data.id });
    setTitle('');
    setDescription('');
    setAssignees([]);
    setDueDate('');
    setMilestoneId('');
    setPriority('medium');
    setLabelIds([]);
    onCreated?.();
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border-2 border-fg bg-surface-2 p-4 shadow-brut-sm flex flex-col gap-3"
    >
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('What needs doing?')}
        className="text-base font-bold"
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t('Add a description (optional)')}
        rows={2}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="priority">{t('Priority')}</Label>
        <Select value={priority} onValueChange={(v) => setPriority(v as TodoPriority)}>
          <SelectTrigger id="priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_ORDER.map((p) => (
              <SelectItem key={p} value={p}>
                <span className="inline-flex items-center gap-2">
                  <span className={cn('h-2.5 w-2.5 rounded-full border border-fg', PRIORITY_META[p].dot)} />
                  {t(PRIORITY_META[p].label)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>{t('Assignees')}</Label>
        {members.length === 0 ? (
          <p className="text-xs text-fg-muted">{t('No members to assign yet.')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const on = assignees.includes(m.id);
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => toggleAssignee(m.id)}
                  aria-pressed={on}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border-2 border-fg px-2.5 py-1 text-xs font-bold shadow-brut-sm transition-colors',
                    on ? 'bg-accent-blue text-white' : 'bg-surface text-fg hover:bg-surface-2',
                  )}
                >
                  {on ? <Check className="h-3 w-3" /> : null}
                  {m.display_name}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {projectId ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="milestone">{t('Milestone')}</Label>
          <Select
            value={milestoneId || '__none__'}
            onValueChange={(v) => setMilestoneId(v === '__none__' ? '' : v)}
          >
            <SelectTrigger id="milestone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t('No milestone')}</SelectItem>
              {milestones.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="due">{t('Due')}</Label>
        <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      {allLabels ? (
        <div className="flex flex-col gap-1.5">
          <Label>{t('Labels')}</Label>
          {allLabels.length === 0 ? (
            <button
              type="button"
              onClick={onManageLabels}
              className="self-start text-xs font-semibold text-accent-blue hover:underline"
            >
              {t('No labels yet — create one')}
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allLabels.map((l) => {
                const on = labelIds.includes(l.id);
                return (
                  <button
                    type="button"
                    key={l.id}
                    onClick={() => toggleLabel(l.id)}
                    aria-pressed={on}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border-2 border-fg px-2.5 py-1 text-xs font-bold shadow-brut-sm transition-colors',
                      on ? labelColorMeta(l.color).chip : 'bg-surface text-fg hover:bg-surface-2',
                    )}
                  >
                    {on ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <span className={cn('h-2 w-2 rounded-full border border-fg', labelColorMeta(l.color).dot)} />
                    )}
                    {l.name}
                  </button>
                );
              })}
              {onManageLabels ? (
                <button
                  type="button"
                  onClick={onManageLabels}
                  className="inline-flex items-center gap-1 rounded-md border-2 border-dashed border-fg/40 px-2 py-1 text-xs font-semibold text-fg-muted hover:text-fg"
                >
                  <Tag className="h-3 w-3" /> {t('Manage labels')}
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
      <div className="flex gap-2 justify-end">
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" /> {t('Cancel')}
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={submitting || !title.trim()}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : editing ? (
            <Save className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {editing ? t('Save changes') : t('Add todo')}
        </Button>
      </div>
    </form>
  );
}
