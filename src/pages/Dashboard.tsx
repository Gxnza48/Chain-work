import { useCallback, useEffect, useState } from 'react';
import { Plus, KeyRound, RefreshCw, Layers } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { ChainCard } from '@/components/dashboard/ChainCard';
import { CreateChainModal } from '@/components/dashboard/CreateChainModal';
import { JoinChainModal } from '@/components/dashboard/JoinChainModal';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { ChainRow, ChainSummary } from '@/types';

export default function Dashboard() {
  const { user } = useAuth();
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

        <section className="mt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight">Your chains</h2>
              <p className="text-sm text-fg-muted">Shared workspaces you are a member of.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="md" onClick={() => setJoining(true)}>
                <KeyRound className="h-4 w-4" /> Join Chain
              </Button>
              <Button variant="primary" size="md" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Create New Chain
              </Button>
              <button
                type="button"
                onClick={load}
                aria-label="Refresh"
                className="inline-grid h-10 w-10 place-items-center rounded-lg border-2 border-fg bg-surface text-fg shadow-brut-sm"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
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

function EmptyState({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  return (
    <Card>
      <CardContent className="grid place-items-center gap-4 py-16 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-lg border-2 border-fg bg-accent-blue text-white shadow-brut">
          <Layers className="h-7 w-7" strokeWidth={2.4} />
        </span>
        <div>
          <h3 className="font-display text-2xl font-bold tracking-tight">Create your first chain</h3>
          <p className="mt-1 text-sm text-fg-muted">
            A chain is a shared workspace. Make one, invite a teammate, and start building.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onJoin}>
            <KeyRound className="h-4 w-4" /> Join with code
          </Button>
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" /> Create chain
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
