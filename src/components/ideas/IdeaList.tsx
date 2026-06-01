import { useCallback, useEffect, useState } from 'react';
import { Lightbulb, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { IdeaCard } from './IdeaCard';
import { IdeaForm } from './IdeaForm';
import { useT } from '@/lib/i18n';
import type { IdeaRow, IdeaVoteRow, IdeaWithVotes, UserRow } from '@/types';

interface Props {
  chainId: string;
  projectId?: string | null;
  members: UserRow[];
}

type SortMode = 'top' | 'newest' | 'oldest';

export function IdeaList({ chainId, projectId, members }: Props) {
  const { user } = useAuth();
  const t = useT();
  const [ideas, setIdeas] = useState<IdeaWithVotes[]>([]);
  const [sort, setSort] = useState<SortMode>('top');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const query = supabase.from('ideas').select('*').eq('chain_id', chainId);
    if (projectId) query.eq('project_id', projectId);
    else query.is('project_id', null);
    const { data: ideaData, error: ideaErr } = await query.order('created_at', { ascending: false });
    if (ideaErr) {
      toast.error(t('Could not load ideas'), { description: ideaErr.message });
      setIdeas([]);
      setLoading(false);
      return;
    }

    const ids = (ideaData ?? []).map((i) => i.id);
    let votes: IdeaVoteRow[] = [];
    if (ids.length > 0) {
      const { data } = await supabase.from('idea_votes').select('*').in('idea_id', ids);
      votes = (data ?? []) as IdeaVoteRow[];
    }
    const memberMap = new Map(members.map((m) => [m.id, m]));

    const enriched: IdeaWithVotes[] = (ideaData ?? []).map((i: IdeaRow) => {
      const ideaVotes = votes.filter((v) => v.idea_id === i.id);
      const score = ideaVotes.reduce((acc, v) => acc + v.vote, 0);
      const own = ideaVotes.find((v) => v.user_id === user?.id);
      const author = memberMap.get(i.created_by) ?? null;
      return {
        ...i,
        score,
        user_vote: own ? (own.vote as 1 | -1) : 0,
        author: author
          ? {
              id: author.id,
              display_name: author.display_name,
              username: author.username,
              avatar_url: author.avatar_url,
            }
          : null,
      };
    });
    setIdeas(enriched);
    setLoading(false);
  }, [chainId, projectId, members, user?.id]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`ideas:${chainId}:${projectId ?? 'chain'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ideas', filter: `chain_id=eq.${chainId}` },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'idea_votes' },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch).catch(() => {});
    };
  }, [chainId, projectId, load]);

  const sorted = [...ideas].sort((a, b) => {
    if (sort === 'top') return b.score - a.score || b.created_at.localeCompare(a.created_at);
    if (sort === 'newest') return b.created_at.localeCompare(a.created_at);
    return a.created_at.localeCompare(b.created_at);
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md border-2 border-fg bg-accent-amber text-white shadow-brut-sm">
            <Lightbulb className="h-4 w-4" />
          </span>
          <h3 className="font-display text-lg font-bold tracking-tight">{t('Ideas')}</h3>
          <Badge variant="neutral">{ideas.length}</Badge>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
            <SelectTrigger className="h-9 min-w-0 flex-1 sm:w-44 sm:flex-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">{t('Most voted')}</SelectItem>
              <SelectItem value="newest">{t('Newest')}</SelectItem>
              <SelectItem value="oldest">{t('Oldest')}</SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={load}
            className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 border-fg bg-surface text-fg shadow-brut-sm"
            aria-label={t('Refresh')}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {!adding ? (
            <Button size="sm" onClick={() => setAdding(true)} className="shrink-0">
              <Plus className="h-4 w-4" /> {t('Add idea')}
            </Button>
          ) : null}
        </div>
      </div>

      {adding ? (
        <IdeaForm
          chainId={chainId}
          projectId={projectId}
          onCancel={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            load();
          }}
        />
      ) : null}

      {loading ? (
        <p className="text-sm text-fg-muted">{t('Loading…')}</p>
      ) : sorted.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-fg bg-surface-2 p-8 text-center">
          <p className="font-semibold">{t('No ideas yet.')}</p>
          <p className="mt-1 text-sm text-fg-muted">{t('Capture a loose thought — your team can vote it up.')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((i) => (
            <IdeaCard key={i.id} idea={i} onChange={load} />
          ))}
        </div>
      )}
    </div>
  );
}
