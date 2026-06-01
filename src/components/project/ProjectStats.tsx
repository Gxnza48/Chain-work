import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Circle, Clock, Lightbulb, Paperclip } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/Skeleton';
import { PRIORITY_META, PRIORITY_ORDER } from '@/components/todos/priority';
import { cn, dueState } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import type { TodoPriority, TodoRow } from '@/types';

interface Props {
  projectId: string;
  /** Bump to force a refetch (mirrors the Roadmap's refreshSignal). */
  refreshSignal?: number;
}

type StatRow = Pick<TodoRow, 'status' | 'priority' | 'due_date'>;

export function ProjectStats({ projectId, refreshSignal }: Props) {
  const t = useT();
  const [todos, setTodos] = useState<StatRow[]>([]);
  const [ideaCount, setIdeaCount] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [{ data: tData }, { count: ideas }, { count: files }] = await Promise.all([
      supabase.from('todos').select('status, priority, due_date').eq('project_id', projectId),
      supabase.from('ideas').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
      supabase
        .from('attachments')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId),
    ]);
    setTodos((tData ?? []) as StatRow[]);
    setIdeaCount(ideas ?? 0);
    setFileCount(files ?? 0);
    setLoading(false);
  }, [projectId]);

  // Refetch on mount, when the project changes, or when a sibling bumps refreshSignal.
  useEffect(() => {
    setLoading(true);
    load();
  }, [load, refreshSignal]);

  // Subscribe once per project (no churn when refreshSignal changes).
  useEffect(() => {
    const ch = supabase
      .channel(`project-stats:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos', filter: `project_id=eq.${projectId}` },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ideas', filter: `project_id=eq.${projectId}` },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attachments', filter: `project_id=eq.${projectId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch).catch(() => {});
    };
  }, [projectId, load]);

  if (loading) {
    return <Skeleton className="h-28 w-full rounded-lg" />;
  }

  const total = todos.length;
  const done = todos.filter((x) => x.status === 'done').length;
  const inProgress = todos.filter((x) => x.status === 'in_progress').length;
  const pending = todos.filter((x) => x.status === 'pending').length;
  const overdue = todos.filter((x) => x.status !== 'done' && dueState(x.due_date)?.state === 'overdue')
    .length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const priorityCounts = PRIORITY_ORDER.map((p) => ({
    p,
    n: todos.filter((x) => x.status !== 'done' && x.priority === p).length,
  })).filter((x) => x.n > 0);

  const seg = (n: number) => (total === 0 ? 0 : (n / total) * 100);

  return (
    <div className="rounded-lg border-2 border-fg bg-surface p-4 shadow-brut-sm">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-fg-muted">
            {t('Project overview')}
          </p>
          <p className="mt-1 font-display text-3xl font-bold tracking-tight">
            {pct}
            <span className="text-lg text-fg-muted">% {t('complete')}</span>
          </p>
        </div>
        {overdue > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-fg bg-accent-rose px-2.5 py-1 text-xs font-bold text-white shadow-brut-sm">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t('{n} overdue', { n: overdue })}
          </span>
        ) : null}
      </div>

      {/* segmented progress bar */}
      <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full border-2 border-fg bg-surface-2">
        <div className="h-full bg-accent-emerald" style={{ width: `${seg(done)}%` }} />
        <div className="h-full bg-accent-amber" style={{ width: `${seg(inProgress)}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Tile icon={<CheckCircle2 className="h-4 w-4" />} label={t('Done')} value={done} tone="emerald" />
        <Tile icon={<Clock className="h-4 w-4" />} label={t('In progress')} value={inProgress} tone="amber" />
        <Tile icon={<Circle className="h-4 w-4" />} label={t('Pending')} value={pending} tone="neutral" />
        <Tile
          icon={<AlertTriangle className="h-4 w-4" />}
          label={t('Overdue')}
          value={overdue}
          tone={overdue > 0 ? 'rose' : 'neutral'}
        />
        <Tile icon={<Lightbulb className="h-4 w-4" />} label={t('Ideas')} value={ideaCount} tone="neutral" />
        <Tile icon={<Paperclip className="h-4 w-4" />} label={t('Files')} value={fileCount} tone="neutral" />
      </div>

      {priorityCounts.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-fg-muted">{t('Open by priority:')}</span>
          {priorityCounts.map(({ p, n }) => (
            <PriorityChip key={p} priority={p} count={n} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

const TONE: Record<string, string> = {
  emerald: 'text-accent-emerald',
  amber: 'text-accent-amber',
  rose: 'text-accent-rose',
  neutral: 'text-fg',
};

function Tile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: keyof typeof TONE;
}) {
  return (
    <div className="rounded-md border-2 border-fg bg-surface-2 p-2.5">
      <div className={cn('flex items-center gap-1.5', TONE[tone])}>
        {icon}
        <span className="font-display text-xl font-bold tracking-tight">{value}</span>
      </div>
      <p className="mt-0.5 text-[11px] font-semibold text-fg-muted">{label}</p>
    </div>
  );
}

function PriorityChip({ priority, count }: { priority: TodoPriority; count: number }) {
  const t = useT();
  const meta = PRIORITY_META[priority];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-fg bg-surface px-2 py-0.5 text-xs font-bold">
      <span className={cn('h-2.5 w-2.5 rounded-full border border-fg', meta.dot)} />
      {t(meta.label)}
      <span className="font-mono text-fg-muted">{count}</span>
    </span>
  );
}
