import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import type { NotificationRow, NotificationWithActor } from '@/types';

const PAGE = 30;
const MAX_KEPT = 50;

interface Result {
  items: NotificationWithActor[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export function useNotifications(): Result {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [items, setItems] = useState<NotificationWithActor[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const hydrateActor = useCallback(async (actorId: string | null) => {
    if (!actorId) return;
    const { data } = await supabase
      .from('users')
      .select('id, display_name, username, avatar_url')
      .eq('id', actorId)
      .maybeSingle();
    if (!data) return;
    setItems((prev) => prev.map((n) => (n.actor_id === actorId && !n.actor ? { ...n, actor: data } : n)));
  }, []);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);

    (async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*, actor:actor_id ( id, display_name, username, avatar_url )')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(PAGE);
      if (!active) return;
      setItems((data ?? []) as unknown as NotificationWithActor[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as NotificationRow;
            if (itemsRef.current.some((n) => n.id === row.id)) return;
            setItems((prev) => [{ ...row, actor: null }, ...prev].slice(0, MAX_KEPT));
            void hydrateActor(row.actor_id);
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as NotificationRow;
            setItems((prev) => prev.map((n) => (n.id === row.id ? { ...n, ...row } : n)));
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string };
            setItems((prev) => prev.filter((n) => n.id !== old.id));
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [userId, hydrateActor]);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  }, [userId]);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  return { items, unreadCount, loading, markRead, markAllRead };
}
