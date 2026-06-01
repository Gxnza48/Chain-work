import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Pencil, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ChainLoader } from '@/components/ui/ChainLoader';
import { TodoList } from '@/components/todos/TodoList';
import { IdeaList } from '@/components/ideas/IdeaList';
import { AttachmentList } from '@/components/attachments/AttachmentList';
import { Roadmap } from './Roadmap';
import { useT } from '@/lib/i18n';
import type { ProjectRow, UserRow } from '@/types';

interface Props {
  projectId: string;
  members: UserRow[];
  onBack: () => void;
}

export function ProjectView({ projectId, members, onBack }: Props) {
  const t = useT();
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [todoRev, setTodoRev] = useState(0);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();
    if (data) {
      setProject(data);
      setName(data.name);
      setDescription(data.description ?? '');
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`project:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function save() {
    if (!project) return;
    if (!name.trim()) {
      toast.error(t('Project name cannot be empty'));
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('projects')
      .update({ name: name.trim(), description: description.trim() || null })
      .eq('id', project.id);
    setSaving(false);
    if (error) {
      toast.error(t('Could not save'), { description: error.message });
      return;
    }
    setEditing(false);
    toast.success(t('Project saved'));
  }

  if (loading || !project) {
    return (
      <div className="grid place-items-center p-12">
        <ChainLoader size={56} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 mb-2">
            <ArrowLeft className="h-4 w-4" />
            {t('All projects')}
          </Button>
          {editing ? (
            <div className="flex flex-col gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('Project name')}
                className="text-xl font-display font-bold"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('Description')}
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t('Save')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4" />
                  {t('Cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="font-display text-3xl font-bold tracking-tight break-words">{project.name}</h2>
              {project.description ? (
                <p className="mt-1 max-w-3xl text-base text-fg-muted">{project.description}</p>
              ) : (
                <p className="mt-1 text-sm italic text-fg-muted">{t('No description')}</p>
              )}
            </>
          )}
        </div>
        {!editing ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(true)}
            className="shrink-0 self-start"
          >
            <Pencil className="h-4 w-4" /> {t('Edit')}
          </Button>
        ) : null}
      </div>

      <Tabs defaultValue="todos">
        <TabsList>
          <TabsTrigger value="todos">{t('Todos')}</TabsTrigger>
          <TabsTrigger value="ideas">{t('Ideas')}</TabsTrigger>
          <TabsTrigger value="links">{t('Links & Media')}</TabsTrigger>
        </TabsList>
        <TabsContent value="todos">
          <TodoList
            chainId={project.chain_id}
            projectId={project.id}
            members={members}
            heading="Project todos"
            onChanged={() => setTodoRev((r) => r + 1)}
          />
        </TabsContent>
        <TabsContent value="ideas">
          <IdeaList chainId={project.chain_id} projectId={project.id} members={members} />
        </TabsContent>
        <TabsContent value="links">
          <AttachmentList projectId={project.id} members={members} />
        </TabsContent>
      </Tabs>

      <Roadmap projectId={project.id} members={members} refreshSignal={todoRev} />
    </div>
  );
}
