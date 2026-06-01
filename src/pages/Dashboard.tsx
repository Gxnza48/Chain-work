import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Folder, Plus, KeyRound, RefreshCw, Layers, Search } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { ChainCard } from '@/components/dashboard/ChainCard';
import { CreateChainModal } from '@/components/dashboard/CreateChainModal';
import { JoinChainModal } from '@/components/dashboard/JoinChainModal';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { getRecentProjects } from '@/lib/recent';
import { useUIStore } from '@/store/ui';
import { cn } from '@/lib/utils';
import type { ChainRow, ChainSummary } from '@/types';

export default function Dashboard() {
  const { user } = useAuth();
  const t = useT();
  const [chains, setChains] = useState<ChainSummary[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: memberships, error } = await supabase
      .from('chain_members')
      .select('chain_id, chains(*)')
      .eq('user_id', user.id);

    if (error) {
      // eslint-disable-next-line no-console
      console.warn('dashboard load failed', error);
      setChains([]);
      return;
    }

    const chainRows = (memberships ?? [])
      .map((row) => (row as unknown as { chains: ChainRow }).chains)
      .filter((c): c is ChainRow => Boolean(c));

    // Resolve every chain's member count + last activity in parallel rather than
    // serially in a for-loop — this was the main cause of slow dashboard loads.
    const summaries: ChainSummary[] = await Promise.all(
      chainRows.map(async (chain) => {
        const [{ count: memberCount }, { data: latest }] = await Promise.all([
          supabase
            .from('chain_members')
            .select('id', { count: 'exact', head: true })
            .eq('chain_id', chain.id),
          supabase
            .from('todos')
            .select('created_at')
            .eq('chain_id', chain.id)
            .order('created_at', { ascending: false })
            .limit(1),
        ]);
        return {
          ...chain,
          member_count: memberCount ?? 0,
          last_activity: latest?.[0]?.created_at ?? chain.created_at,
        };
      }),
    );

    summaries.sort((a, b) => (b.last_activity ?? '').localeCompare(a.last_activity ?? ''));
    setChains(summaries);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-10">
        <ProfileCard />

        <CommandHint />
        <RecentProjectsStrip />

        <section className="mt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-bold tracking-tight">{t('Your chains')}</h2>
                <p className="text-sm text-fg-muted">{t('Shared workspaces you are a member of.')}</p>
              </div>
              {/* On mobile the refresh sits beside the title; on desktop it joins the action row below. */}
              <RefreshButton onClick={load} label={t('Refresh')} className="sm:hidden" />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setJoining(true)}
                className="w-full sm:w-auto"
              >
                <KeyRound className="h-4 w-4" /> {t('Join Chain')}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setCreating(true)}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" /> {t('Create New Chain')}
              </Button>
              <RefreshButton onClick={load} label={t('Refresh')} className="hidden sm:inline-grid" />
            </div>
          </div>

          <div className="mt-6">
            {chains === null ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ) : chains.length === 0 ? (
              <EmptyState onCreate={() => setCreating(true)} onJoin={() => setJoining(true)} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {chains.map((c) => (
                  <ChainCard key={c.id} chain={c} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <CreateChainModal open={creating} onOpenChange={setCreating} onCreated={load} />
      <JoinChainModal open={joining} onOpenChange={setJoining} onJoined={load} />
    </AppShell>
  );
}

function CommandHint() {
  const t = useT();
  const setPaletteOpen = useUIStore((s) => s.setPaletteOpen);
  const mac =
    typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
  return (
    <button
      type="button"
      onClick={() => setPaletteOpen(true)}
      className="mt-8 flex w-full items-center gap-2.5 rounded-lg border-2 border-fg bg-surface px-3 py-2.5 text-left shadow-brut-sm transition-colors hover:bg-surface-2"
    >
      <Search className="h-4 w-4 shrink-0 text-fg-muted" />
      <span className="flex-1 text-sm font-medium text-fg-muted">{t('Search or jump to anything…')}</span>
      <kbd className="shrink-0 rounded border-2 border-fg bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-bold text-fg-muted">
        {mac ? '⌘' : 'Ctrl'} K
      </kbd>
    </button>
  );
}

function RecentProjectsStrip() {
  const t = useT();
  const [recents] = useState(() => getRecentProjects());
  if (recents.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-fg-muted">
        {t('Jump back in')}
      </h2>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {recents.map((r) => (
          <Link
            key={r.projectId}
            to={`/chain/${r.chainId}?project=${r.projectId}`}
            className="flex min-w-[12rem] shrink-0 items-center gap-2.5 rounded-lg border-2 border-fg bg-surface p-3 shadow-brut-sm brut-press"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 border-fg bg-accent-blue text-white shadow-brut-sm">
              <Folder className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{r.name}</span>
              <span className="block truncate text-[11px] text-fg-muted">{t('Open project')}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RefreshButton({
  onClick,
  label,
  className,
}: {
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'inline-grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 border-fg bg-surface text-fg shadow-brut-sm',
        'transition-transform duration-150 hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-0 active:translate-y-0',
        className,
      )}
    >
      <RefreshCw className="h-4 w-4" />
    </button>
  );
}

function EmptyState({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  const t = useT();
  return (
    <Card>
      <CardContent className="grid place-items-center gap-4 py-16 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-lg border-2 border-fg bg-accent-blue text-white shadow-brut">
          <Layers className="h-7 w-7" strokeWidth={2.4} />
        </span>
        <div>
          <h3 className="font-display text-2xl font-bold tracking-tight">{t('Create your first chain')}</h3>
          <p className="mt-1 text-sm text-fg-muted">
            {t('A chain is a shared workspace. Make one, invite a teammate, and start building.')}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="secondary" onClick={onJoin} className="w-full sm:w-auto">
            <KeyRound className="h-4 w-4" /> {t('Join with code')}
          </Button>
          <Button onClick={onCreate} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" /> {t('Create chain')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
