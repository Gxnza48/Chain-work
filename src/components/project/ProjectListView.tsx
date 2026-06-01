import { useCallback, useEffect, useState } from 'react';
import { Folder, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { supabase } from '@/lib/supabase';
import { ProjectCard } from './ProjectCard';
import { CreateProjectModal } from './CreateProjectModal';
import { useT } from '@/lib/i18n';
import type { ProjectRow, ProjectSummary, TodoRow, UserRow } from '@/types';

const PROJECT_CAP = 25;

interface Props {
  chainId: string;
  members: UserRow[];
  canManage?: boolean;
  onOpen: (projectId: string) => void;
}

export function ProjectListView({ chainId, members, canManage, onOpen }: Props) {
  const t = useT();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const { data: projData, error } = await supabase
      .from('projects')
      .select('*')
      .eq('chain_id', chainId)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error(t('Could not load projects'), { description: error.message });
      setProjects([]);
      return;
    }
    const ids = (projData ?? []).map((p) => p.id);
    let todos: TodoRow[] = [];
    if (ids.length > 0) {
      const { data: tData } = await supabase
        .from('todos')
        .select('id, project_id, status, created_by')
        .in('project_id', ids);
      todos = (tData ?? []) as TodoRow[];
    }

    const summaries: ProjectSummary[] = (projData ?? []).map((p: ProjectRow) => {
      const pTodos = todos.filter((t) => t.project_id === p.id);
      const total_todos = pTodos.length;
      const completed_todos = pTodos.filter((t) => t.status === 'done').length;
      const contributorIds = new Set(pTodos.map((t) => t.created_by));
      contributorIds.add(p.created_by);
      const avatars = members
        .filter((m) => contributorIds.has(m.id))
        .map((m) => ({ id: m.id, display_name: m.display_name, avatar_url: m.avatar_url }));
      return { ...p, total_todos, completed_todos, member_avatars: avatars };
    });
    setProjects(summaries);
  }, [chainId, members]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`projects:${chainId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `chain_id=eq.${chainId}` },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos', filter: `chain_id=eq.${chainId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch).catch(() => {});
    };
  }, [chainId, load]);

  const atCap = (projects?.length ?? 0) >= PROJECT_CAP;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-bold tracking-tight">{t('Projects')}</h2>
          <p className="text-sm text-fg-muted">
            {projects ? t('{n} / {cap} used', { n: projects.length, cap: PROJECT_CAP }) : '…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 border-fg bg-surface text-fg shadow-brut-sm"
            aria-label={t('Refresh')}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Button
            size="md"
            className="flex-1 sm:flex-none"
            onClick={() => {
              if (atCap) {
                toast.error(t('Project limit reached'), {
                  description: t('A chain may hold up to 25 projects.'),
                });
                return;
              }
              setCreating(true);
            }}
            disabled={atCap}
          >
            <Plus className="h-4 w-4" /> {t('New project')}
          </Button>
        </div>
      </div>

      {projects === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-4 py-16 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-lg border-2 border-fg bg-accent-blue text-white shadow-brut">
              <Folder className="h-7 w-7" strokeWidth={2.4} />
            </span>
            <h3 className="font-display text-2xl font-bold tracking-tight">{t('Spin up your first project')}</h3>
            <p className="max-w-sm text-sm text-fg-muted">
              {t('Projects are bounded containers: todos, ideas, attachments, and an append-only Roadmap.')}
            </p>
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> {t('New project')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} canManage={canManage} onOpen={onOpen} onRenamed={load} />
          ))}
        </div>
      )}

      <CreateProjectModal
        chainId={chainId}
        open={creating}
        onOpenChange={setCreating}
        onCreated={(id) => {
          load();
          onOpen(id);
        }}
      />
    </div>
  );
}
