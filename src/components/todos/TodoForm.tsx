import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { UserRow } from '@/types';

interface Props {
  chainId: string;
  projectId?: string | null;
  members: UserRow[];
  onCreated?: () => void;
  onCancel?: () => void;
}

export function TodoForm({ chainId, projectId, members, onCreated, onCancel }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('unassigned');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) {
      toast.error('Give the todo a title');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('todos').insert({
      chain_id: chainId,
      project_id: projectId ?? null,
      title: title.trim(),
      description: description.trim() || null,
      assigned_to: assignedTo === 'unassigned' ? null : assignedTo,
      due_date: dueDate || null,
      created_by: user.id,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Could not create todo', { description: error.message });
      return;
    }
    setTitle('');
    setDescription('');
    setAssignedTo('unassigned');
    setDueDate('');
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
        placeholder="What needs doing?"
        className="text-base font-bold"
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a description (optional)"
        rows={2}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="assignee">Assignee</Label>
          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger id="assignee">
              <SelectValue placeholder="Assign to…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.display_name} (@{m.username})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="due">Due</Label>
          <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" /> Cancel
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={submitting || !title.trim()}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add todo
        </Button>
      </div>
    </form>
  );
}
