import { useState } from 'react';
import { Bug, FileText, Loader2, PenLine, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface Props {
  chainId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

type TemplateId = 'blank' | 'sprint' | 'content' | 'bugs';

interface Template {
  id: TemplateId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  todos: string[];
}

/** Starter checklists. Todo titles are translation keys so they seed in the user's language. */
const TEMPLATES: Template[] = [
  { id: 'blank', label: 'Blank', icon: FileText, todos: [] },
  {
    id: 'sprint',
    label: 'Sprint',
    icon: Rocket,
    todos: ['Plan the sprint', 'Build the core', 'Test & QA', 'Ship & announce'],
  },
  {
    id: 'content',
    label: 'Content',
    icon: PenLine,
    todos: ['Outline', 'First draft', 'Edit & review', 'Publish'],
  },
  {
    id: 'bugs',
    label: 'Bug triage',
    icon: Bug,
    todos: ['Reproduce the issue', 'Find the root cause', 'Apply the fix', 'Verify & close'],
  },
];

export function CreateProjectModal({ chainId, open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const t = useT();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<TemplateId>('blank');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName('');
    setDescription('');
    setTemplate('blank');
    setSubmitting(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from('projects')
      .insert({
        chain_id: chainId,
        name: name.trim(),
        description: description.trim() || null,
        created_by: user.id,
      })
      .select()
      .single();
    if (error || !data) {
      setSubmitting(false);
      if (error && /Project limit reached/.test(error.message)) {
        toast.error(t('Project limit reached'), { description: t('A chain may hold up to 25 projects.') });
      } else {
        toast.error(t('Could not create project'), { description: error?.message });
      }
      return;
    }

    // Seed the chosen template's starter todos.
    const tpl = TEMPLATES.find((x) => x.id === template);
    if (tpl && tpl.todos.length > 0) {
      await supabase.from('todos').insert(
        tpl.todos.map((title, i) => ({
          chain_id: chainId,
          project_id: data.id,
          title: t(title),
          created_by: user.id,
          order_index: i,
          priority: 'medium' as const,
        })),
      );
    }

    setSubmitting(false);
    onOpenChange(false);
    reset();
    onCreated?.(data.id);
    toast.success(t('Project created'));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{t('New project')}</DialogTitle>
            <DialogDescription>
              {t('Projects bundle todos, ideas, attachments, and a Roadmap. Each chain can hold up to 25.')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-name">{t('Name')}</Label>
              <Input
                id="project-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('e.g. Launch site')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-description">{t('Description (optional)')}</Label>
              <Textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('What is this project about?')}
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t('Start from a template')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((tpl) => {
                  const Icon = tpl.icon;
                  const active = template === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setTemplate(tpl.id)}
                      aria-pressed={active}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border-2 border-fg px-3 py-2 text-left shadow-brut-sm transition-colors',
                        active ? 'bg-accent-blue text-white' : 'bg-surface text-fg hover:bg-surface-2',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">{t(tpl.label)}</span>
                        <span
                          className={cn(
                            'block text-[11px] font-semibold',
                            active ? 'text-white/80' : 'text-fg-muted',
                          )}
                        >
                          {tpl.todos.length === 0
                            ? t('Empty')
                            : t('{n} starter todos', { n: tpl.todos.length })}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
