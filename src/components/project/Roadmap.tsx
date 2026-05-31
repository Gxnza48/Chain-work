import { useEffect, useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useRelativeTimeTick } from '@/hooks/useRelativeTimeTick';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { initials, relativeTime } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import type { TodoRow, UserRow } from '@/types';

interface Props {
  projectId: string;
  members: UserRow[];
  onChange?: () => void;
}

export function Roadmap({ projectId, members, onChange }: Props) {
  const t = useT();
  const [items, setItems] = useState<TodoRow[]>([]);
  const [loading, setLoading] = useState(true);
  useRelativeTimeTick();

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('todos')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'done')
      .order('completed_at', { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`roadmap:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos', filter: `project_id=eq.${projectId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function reopen(todo: TodoRow) {
    const { error } = await supabase
      .from('todos')
      .update({ status: 'pending', completed_at: null, completed_by: null })
      .eq('id', todo.id);
    if (error) {
      toast.error(t('Could not reopen'), { description: error.message });
      return;
    }
    toast.success(t('Re-opened, removed from Roadmap'));
    onChange?.();
  }

  const memberMap = new Map(members.map((m) => [m.id, m]));

  return (
    <section className="rounded-lg border-2 border-fg bg-surface shadow-brut p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-md border-2 border-fg bg-accent-emerald text-white shadow-brut-sm">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <h3 className="font-display text-lg font-bold tracking-tight">Roadmap</h3>
        <span className="font-mono text-xs text-fg-muted">{t('append-only history')}</span>
      </div>
      <ol className="mt-4 flex flex-col gap-3">
        {loading ? (
          <li className="text-sm text-fg-muted">{t('Loading…')}</li>
        ) : items.length === 0 ? (
          <li className="text-sm text-fg-muted">{t('No completed todos yet. Knock one out and watch it land here.')}</li>
        ) : (
          items.map((item) => {
            const completedBy = item.completed_by ? memberMap.get(item.completed_by) : null;
            return (
              <li key={item.id} className="flex items-start gap-3 rounded-md border-2 border-fg bg-surface-2 p-3">
                <span className="mt-1 grid h-5 w-5 place-items-center rounded-full border-2 border-fg bg-accent-emerald text-white">
                  <CheckCircle2 className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-fg break-words">{item.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                    {completedBy ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          {completedBy.avatar_url ? (
                            <AvatarImage src={completedBy.avatar_url} alt={completedBy.display_name} />
                          ) : null}
                          <AvatarFallback className="text-[9px]">
                            {initials(completedBy.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{completedBy.display_name}</span>
                      </span>
                    ) : null}
                    <span className="font-mono">{relativeTime(item.completed_at)}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => reopen(item)} title={t('Re-open todo')}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </li>
            );
          })
        )}
      </ol>
    </section>
  );
}
