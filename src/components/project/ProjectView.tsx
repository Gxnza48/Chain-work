import { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardCopy, FileJson, FileText, Loader2, Pencil, Save, Share2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { ChainLoader } from '@/components/ui/ChainLoader';
import { TodoList } from '@/components/todos/TodoList';
import { IdeaList } from '@/components/ideas/IdeaList';
import { AttachmentList } from '@/components/attachments/AttachmentList';
import { ProjectStats } from './ProjectStats';
import { Roadmap } from './Roadmap';
import { MilestonesPanel } from './MilestonesPanel';
import { buildProjectJSON, buildProjectMarkdown, downloadFile, slugify } from '@/lib/export';
import { forgetRecentProject, recordRecentProject } from '@/lib/recent';
import { copyToClipboard } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import type { AttachmentRow, IdeaRow, ProjectRow, TodoRow, UserRow } from '@/types';

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
  const [tab, setTab] = useState('todos');
  const [milestoneFilter, setMilestoneFilter] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('projects').select('*').eq('id', projectId).maybeSingle();
    if (data) {
      setProject(data);
      setName(data.name);
      setDescription(data.description ?? '');
      recordRecentProject({ chainId: data.chain_id, projectId: data.id, name: data.name });
    } else {
      // Project was deleted or isn't accessible (e.g. a stale "recent" / deep link).
      forgetRecentProject(projectId);
      toast.error(t('Project not found'));
      onBack();
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

  async function exportProject(kind: 'copy' | 'md' | 'json') {
    if (!project) return;
    const [{ data: todoData }, { data: ideaData }, { data: fileData }] = await Promise.all([
      supabase
        .from('todos')
        .select('*')
        .eq('project_id', project.id)
        .order('status', { ascending: true })
        .order('order_index', { ascending: true }),
      supabase
        .from('ideas')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('attachments')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false }),
    ]);
    const todos = (todoData ?? []) as TodoRow[];
    const ideas = (ideaData ?? []) as IdeaRow[];
    const files = (fileData ?? []) as AttachmentRow[];
    const slug = slugify(project.name);

    if (kind === 'json') {
      downloadFile(`${slug}.json`, buildProjectJSON(project, todos, ideas, files), 'application/json');
      toast.success(t('Project exported'));
      return;
    }
    const md = buildProjectMarkdown(project, todos, ideas, files);
    if (kind === 'md') {
      downloadFile(`${slug}.md`, md, 'text/markdown');
      toast.success(t('Project exported'));
      return;
    }
    const ok = await copyToClipboard(md);
    if (ok) toast.success(t('Summary copied to clipboard'));
    else toast.error(t('Could not copy'));
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
          <div className="flex shrink-0 items-center gap-2 self-start">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <Share2 className="h-4 w-4" /> {t('Export')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => exportProject('copy')}>
                  <ClipboardCopy className="h-4 w-4" /> {t('Copy summary')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportProject('md')}>
                  <FileText className="h-4 w-4" /> {t('Download Markdown')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => exportProject('json')}>
                  <FileJson className="h-4 w-4" /> {t('Download JSON')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> {t('Edit')}
            </Button>
          </div>
        ) : null}
      </div>

      <ProjectStats projectId={project.id} refreshSignal={todoRev} />

      <MilestonesPanel
        chainId={project.chain_id}
        projectId={project.id}
        refreshSignal={todoRev}
        selectedId={milestoneFilter}
        onSelect={(id) => {
          setMilestoneFilter(id);
          if (id) setTab('todos');
        }}
      />

      <Tabs value={tab} onValueChange={setTab}>
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
            milestoneFilter={milestoneFilter}
            onClearMilestoneFilter={() => setMilestoneFilter(null)}
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
