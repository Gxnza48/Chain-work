import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { LabelColor, LabelRow } from '@/types';

export function useLabels(chainId: string) {
  const { user } = useAuth();
  const [labels, setLabels] = useState<LabelRow[]>([]);
  const [linksByTodo, setLinksByTodo] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: labelRows }, { data: links }] = await Promise.all([
      supabase.from('labels').select('*').eq('chain_id', chainId).order('name', { ascending: true }),
      supabase
        .from('todo_labels')
        .select('todo_id, label_id, labels!inner(chain_id)')
        .eq('labels.chain_id', chainId),
    ]);
    setLabels(labelRows ?? []);
    const map = new Map<string, string[]>();
    for (const l of (links ?? []) as Array<{ todo_id: string; label_id: string }>) {
      const arr = map.get(l.todo_id) ?? [];
      arr.push(l.label_id);
      map.set(l.todo_id, arr);
    }
    setLinksByTodo(map);
    setLoading(false);
  }, [chainId]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`labels:${chainId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'labels', filter: `chain_id=eq.${chainId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todo_labels' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch).catch(() => {}); };
  }, [chainId, load]);

  const labelsForTodo = useCallback(
    (todoId: string): LabelRow[] => {
      const ids = linksByTodo.get(todoId);
      if (!ids) return [];
      return labels.filter((l) => ids.includes(l.id));
    },
    [labels, linksByTodo],
  );

  async function createLabel(name: string, color: LabelColor) {
    if (!user) return { error: { message: 'no-user' } } as const;
    return supabase.from('labels').insert({ chain_id: chainId, name: name.trim(), color, created_by: user.id });
  }
  const renameLabel = (id: string, name: string) => supabase.from('labels').update({ name: name.trim() }).eq('id', id);
  const recolorLabel = (id: string, color: LabelColor) => supabase.from('labels').update({ color }).eq('id', id);
  const deleteLabel = (id: string) => supabase.from('labels').delete().eq('id', id);

  function toggleOnTodo(todoId: string, labelId: string, on: boolean) {
    return on
      ? supabase.from('todo_labels').delete().eq('todo_id', todoId).eq('label_id', labelId)
      : supabase.from('todo_labels').insert({ todo_id: todoId, label_id: labelId });
  }

  return { labels, loading, labelsForTodo, linksByTodo, reload: load, createLabel, renameLabel, recolorLabel, deleteLabel, toggleOnTodo };
}