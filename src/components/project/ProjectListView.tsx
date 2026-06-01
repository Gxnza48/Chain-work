import { useCallback, useEffect, useMemo, useState } from 'react';
import { Folder, Plus, RefreshCw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { supabase } from '@/lib/supabase';
import { ProjectCard } from './ProjectCard';
import { CreateProjectModal } from './CreateProjectModal';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { dueState } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import type { ProjectRow, ProjectSummary, TodoRow, UserRow } from '@/types';

const PROJECT_CAP = 25;

type SortMode = 'recent' | 'name' | 'progress' | 'todos';

interface Props {
  chainId: string;
  members: UserRow[];
  canManage?: boolean;
  onOpen: (projectId: string) => void;
}

function progressPct(p: ProjectSummary): number {
  return p.total_todos === 0 ? 0 : p.completed_todos / p.total_todos;
}

export function ProjectListView({ chainId, members, canManage, onOpen }: Props) {
  const t = useT();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useLocalStorage<SortMode>('chainwork-project-sort', 'recent');
  const [pinned, setPinned] = useLocalStorage<string[]>('chainwork-pinned-projects', []);

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
        .select('id, project_id, status, due_date, created_by')
        .in('project_id', ids);
      todos = (tData ?? []) as TodoRow[];
    }

    const summaries: ProjectSummary[] = (projData ?? []).map((p: ProjectRow) => {
      const pTodos = todos.filter((t) => t.project_id === p.id);
      const total_todos = pTodos.length;
      const completed_todos = pTodos.filter((t) => t.status === 'done').length;
      const overdue_todos = pTodos.filter(
        (t) => t.status !== 'done' && dueState(t.due_date)?.state === 'overdue',
      ).length;
      const contributorIds = new Set(pTodos.map((t) => t.created_by));
      contributorIds.add(p.created_by);
      const avatars = members
        .filter((m) => contributorIds.has(m.id))
        .map((m) => ({ id: m.id, display_name: m.display_name, avatar_url: m.avatar_url }));
      return { ...p, total_todos, completed_todos, overdue_todos, member_avatars: avatars };
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

  function togglePin(id: string) {
    setPinned((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const visible = useMemo(() => {
    if (!projects) return null;
    const q = query.trim().toLowerCase();
    const filtered = q
      ? projects.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.description ?? '').toLowerCase().includes(q),
        )
      : projects;
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progress':
          return progressPct(b) - progressPct(a);
        case 'todos':
          return b.total_todos - a.total_todos;
        default:
          return (b.created_at ?? '').localeCompare(a.created_at ?? '');
      }
    });
    // pinned float to the top, preserving the chosen sort within each band
    return sorted.sort(
      (a, b) => Number(pinned.includes(b.id)) - Number(pinned.includes(a.id)),
    );
  }, [projects, query, sort, pinned]);

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

      {projects && projects.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Search projects…')}
              className="h-9 pl-9"
              aria-label={t('Search projects…')}
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t('Clear')}
                className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-fg-muted hover:bg-surface-2"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
            <SelectTrigger className="h-9 w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t('Sort: Recent')}</SelectItem>
              <SelectItem value="name">{t('Sort: Name A–Z')}</SelectItem>
              <SelectItem value="progress">{t('Sort: Most complete')}</SelectItem>
              <SelectItem value="todos">{t('Sort: Most todos')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

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
      ) : visible && visible.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-fg bg-surface-2 p-8 text-center">
          <p className="font-semibold">{t('No projects match your search.')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible?.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              canManage={canManage}
              onOpen={onOpen}
              onRenamed={load}
              pinned={pinned.includes(p.id)}
              onTogglePin={() => togglePin(p.id)}
            />
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
