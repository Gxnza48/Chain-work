import { useState } from 'react';
import { Loader2, Plus, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/lib/i18n';
import type { MilestoneRow } from '@/types';

interface Props {
  chainId: string;
  projectId: string;
  /** When provided, edits this milestone instead of creating one. */
  milestone?: MilestoneRow;
  onSaved?: () => void;
  onCancel?: () => void;
}

export function MilestoneForm({ chainId, projectId, milestone, onSaved, onCancel }: Props) {
  const { user } = useAuth();
  const t = useT();
  const editing = Boolean(milestone);
  const [title, setTitle] = useState(milestone?.title ?? '');
  const [description, setDescription] = useState(milestone?.description ?? '');
  const [dueDate, setDueDate] = useState(milestone?.due_date ?? '');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) {
      toast.error(t('Give the milestone a title'));
      return;
    }
    setSubmitting(true);

    if (editing && milestone) {
      const { error } = await supabase
        .from('milestones')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
        })
        .eq('id', milestone.id);
      setSubmitting(false);
      if (error) {
        toast.error(t('Could not save milestone'), { description: error.message });
        return;
      }
      toast.success(t('Milestone updated'));
      onSaved?.();
      return;
    }

    const { error } = await supabase.from('milestones').insert({
      chain_id: chainId,
      project_id: projectId,
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate || null,
      created_by: user.id,
    });
    setSubmitting(false);
    if (error) {
      toast.error(t('Could not create milestone'), { description: error.message });
      return;
    }
    toast.success(t('Milestone created'));
    onSaved?.();
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border-2 border-fg bg-surface p-4 shadow-brut-sm flex flex-col gap-3"
    >
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('Milestone title (e.g. Beta launch)')}
        className="text-base font-bold"
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t('Add a description (optional)')}
        rows={2}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="milestone-due">{t('Due')}</Label>
        <Input
          id="milestone-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
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
          {editing ? t('Save changes') : t('Add milestone')}
        </Button>
      </div>
    </form>
  );
}
