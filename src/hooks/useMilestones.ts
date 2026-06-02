// src/hooks/useMilestones.ts — load + live-subscribe to a project's milestones,
// and compute each milestone's progress from project todos.
// Mirrors the Roadmap/ProjectStats channel + reload pattern.

import { useCallback, useEffect, useId, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { MilestoneRow, MilestoneWithProgress } from '@/types';

export function useMilestones(projectId: string, refreshSignal?: number) {
  const [milestones, setMilestones] = useState<MilestoneWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  // Unique per hook instance: useMilestones runs in both MilestonesPanel and
  // TodoList for the same projectId, so the channel topic must not collide.
  const channelId = useId();

  const load = useCallback(async () => {
    // No project context (the chain-level "All todos" view passes ''): nothing
    // to load and no channel to open — bail out cheaply.
    if (!projectId) {
      setMilestones([]);
      setLoading(false);
      return;
    }
    // Milestones for the project + a lightweight (milestone_id, status) slice of
    // its todos to derive progress without a join.
    const [{ data: mData }, { data: tData }] = await Promise.all([
      supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('status', { ascending: true }) // open first
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('todos')
        .select('milestone_id, status')
        .eq('project_id', projectId)
        .not('milestone_id', 'is', null),
    ]);

    const counts = new Map<string, { total: number; done: number }>();
    for (const row of (tData ?? []) as Array<{ milestone_id: string | null; status: string }>) {
      if (!row.milestone_id) continue;
      const c = counts.get(row.milestone_id) ?? { total: 0, done: 0 };
      c.total += 1;
      if (row.status === 'done') c.done += 1;
      counts.set(row.milestone_id, c);
    }

    setMilestones(
      ((mData ?? []) as MilestoneRow[]).map((m) => {
        const c = counts.get(m.id) ?? { total: 0, done: 0 };
        return { ...m, total_todos: c.total, done_todos: c.done };
      }),
    );
    setLoading(false);
  }, [projectId]);

  // Refetch on mount / project change / sibling refreshSignal bump.
  useEffect(() => {
    setLoading(true);
    void load();
  }, [load, refreshSignal]);

  // One channel per project: milestone rows + todo rows (progress source).
  useEffect(() => {
    if (!projectId) return;
    const ch = supabase
      .channel(`milestones:${projectId}:${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'milestones', filter: `project_id=eq.${projectId}` },
        () => void load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos', filter: `project_id=eq.${projectId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch).catch(() => {});
    };
  }, [projectId, load, channelId]);

  return { milestones, loading, reload: load };
}

// ---- Mutations (used by MilestonesPanel / MilestoneForm) ----
// Create:
//   await supabase.from('milestones').insert({
//     chain_id, project_id, title: title.trim(),
//     description: description.trim() || null, due_date: dueDate || null,
//     created_by: user.id,
//   });
// Update (edit):
//   await supabase.from('milestones')
//     .update({ title, description: description || null, due_date: dueDate || null })
//     .eq('id', milestone.id);
// Toggle done / reopen:
//   await supabase.from('milestones')
//     .update({ status: nextStatus }).eq('id', milestone.id);   // 'done' | 'open'
// Delete (todos' milestone_id auto-nulls via ON DELETE SET NULL):
//   await supabase.from('milestones').delete().eq('id', milestone.id);

// In TodoForm submit, add milestone_id to both the insert and update payloads:
//   milestone_id: milestoneId || null,   // milestoneId is '' when "No milestone"