import { useState } from 'react';
import { Loader2, Plus, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { PRIORITY_META, PRIORITY_ORDER } from './priority';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { TodoPriority, TodoRow, UserRow } from '@/types';

interface Props {
  chainId: string;
  projectId?: string | null;
  members: UserRow[];
  /** When provided, the form edits this todo instead of creating a new one. */
  todo?: TodoRow;
  onCreated?: () => void;
  onSaved?: () => void;
  onCancel?: () => void;
}

export function TodoForm({ chainId, projectId, members, todo, onCreated, onSaved, onCancel }: Props) {
  const { user } = useAuth();
  const t = useT();
  const editing = Boolean(todo);
  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const [assignedTo, setAssignedTo] = useState<string>(todo?.assigned_to ?? 'unassigned');
  const [dueDate, setDueDate] = useState(todo?.due_date ?? '');
  const [priority, setPriority] = useState<TodoPriority>(todo?.priority ?? 'medium');
  const [submitting, setSubmitting] = useState(false);

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
          assigned_to: assignedTo === 'unassigned' ? null : assignedTo,
          due_date: dueDate || null,
          priority,
        })
        .eq('id', todo.id);
      setSubmitting(false);
      if (error) {
        toast.error(t('Could not save todo'), { description: error.message });
        return;
      }
      toast.success(t('Todo updated'));
      onSaved?.();
      return;
    }

    const { error } = await supabase.from('todos').insert({
      chain_id: chainId,
      project_id: projectId ?? null,
      title: title.trim(),
      description: description.trim() || null,
      assigned_to: assignedTo === 'unassigned' ? null : assignedTo,
      due_date: dueDate || null,
      priority,
      created_by: user.id,
    });
    setSubmitting(false);
    if (error) {
      toast.error(t('Could not create todo'), { description: error.message });
      return;
    }
    setTitle('');
    setDescription('');
    setAssignedTo('unassigned');
    setDueDate('');
    setPriority('medium');
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="assignee">{t('Assignee')}</Label>
          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger id="assignee">
              <SelectValue placeholder={t('Assign to…')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">{t('Unassigned')}</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.display_name} (@{m.username})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="due">{t('Due')}</Label>
          <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
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
