import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { RichTextEditor } from './RichTextEditor';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  chainId: string;
  projectId?: string | null;
  onCreated?: () => void;
  onCancel?: () => void;
}

export function IdeaForm({ chainId, projectId, onCreated, onCancel }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('<p></p>');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) {
      toast.error('Give the idea a title');
      return;
    }
    setSubmitting(true);
    const cleaned = description === '<p></p>' ? null : description;
    const { error } = await supabase.from('ideas').insert({
      chain_id: chainId,
      project_id: projectId ?? null,
      title: title.trim(),
      description: cleaned,
      created_by: user.id,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Could not save idea', { description: error.message });
      return;
    }
    setTitle('');
    setDescription('<p></p>');
    onCreated?.();
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border-2 border-fg bg-surface-2 p-4 shadow-brut-sm flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="idea-title">Title</Label>
        <Input
          id="idea-title"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's the idea?"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Description (optional)</Label>
        <RichTextEditor value={description} onChange={setDescription} placeholder="Sketch it out…" />
      </div>
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" /> Cancel
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={submitting || !title.trim()}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add idea
        </Button>
      </div>
    </form>
  );
}
