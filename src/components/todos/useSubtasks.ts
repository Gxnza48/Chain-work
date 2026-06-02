import { useCallback, useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/lib/i18n';
import type { SubtaskRow } from '@/types';

export function useSubtasks(todoId: string, chainId: string) {
  const { user } = useAuth();
  const t = useT();
  const channelId = useId();
  const [items, setItems] = useState<SubtaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('subtasks')
      .select('*')
      .eq('todo_id', todoId)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) {
      toast.error(t('Could not load subtasks'), { description: error.message });
      setItems([]);
    } else {
      setItems(data ?? []);
    }
    setLoading(false);
  }, [todoId, t]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`subtasks:${todoId}:${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subtasks', filter: `todo_id=eq.${todoId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch).catch(() => {});
    };
  }, [todoId, load, channelId]);

  const add = useCallback(
    async (title: string) => {
      const trimmed = title.trim();
      if (!trimmed || !user) return;
      const nextOrder = items.length ? Math.max(...items.map((s) => s.order_index)) + 1 : 0;
      const { error } = await supabase.from('subtasks').insert({
        todo_id: todoId,
        chain_id: chainId,
        title: trimmed,
        order_index: nextOrder,
        created_by: user.id,
      });
      if (error) toast.error(t('Could not add subtask'), { description: error.message });
    },
    [items, user, todoId, chainId, t],
  );

  const toggle = useCallback(
    async (id: string, done: boolean) => {
      // Optimistic: realtime confirms shortly after.
      setItems((prev) => prev.map((s) => (s.id === id ? { ...s, done } : s)));
      const { error } = await supabase.from('subtasks').update({ done }).eq('id', id);
      if (error) {
        setItems((prev) => prev.map((s) => (s.id === id ? { ...s, done: !done } : s)));
        toast.error(t('Could not update subtask'), { description: error.message });
      }
    },
    [t],
  );

  const remove = useCallback(
    async (id: string) => {
      setItems((prev) => prev.filter((s) => s.id !== id));
      const { error } = await supabase.from('subtasks').delete().eq('id', id);
      if (error) {
        toast.error(t('Could not delete subtask'), { description: error.message });
        load();
      }
    },
    [t, load],
  );

  const total = items.length;
  const completed = items.filter((s) => s.done).length;

  return { items, loading, total, completed, add, toggle, remove, reload: load };
}
