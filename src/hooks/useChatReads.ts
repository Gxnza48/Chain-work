import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { ChatReadRow } from '@/types';

/**
 * Read receipts via a single last_read_at per (chain, user). A message is "seen
 * by" a user when their last_read_at >= the message's created_at. `markRead`
 * upserts the current user's row to now (throttled by the caller).
 */
export function useChatReads(chainId: string) {
  const { user } = useAuth();
  const channelId = useId();
  const [reads, setReads] = useState<Map<string, string>>(new Map()); // userId -> last_read_at ISO
  const lastMarked = useRef(0);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('chat_reads')
      .select('user_id, last_read_at')
      .eq('chain_id', chainId);
    const map = new Map<string, string>();
    for (const r of (data ?? []) as Array<{ user_id: string; last_read_at: string }>) {
      map.set(r.user_id, r.last_read_at);
    }
    setReads(map);
  }, [chainId]);

  useEffect(() => {
    void load();
    const ch = supabase
      .channel(`chat-reads:${chainId}:${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_reads', filter: `chain_id=eq.${chainId}` },
        (payload) => {
          setReads((prev) => {
            const next = new Map(prev);
            if (payload.eventType === 'DELETE') {
              const old = payload.old as { user_id: string };
              next.delete(old.user_id);
            } else {
              const row = payload.new as ChatReadRow;
              next.set(row.user_id, row.last_read_at);
            }
            return next;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch).catch(() => {});
    };
  }, [chainId, channelId, load]);

  const markRead = useCallback(async () => {
    if (!user) return;
    // Throttle: at most once every 4s (avoids a write per incoming message).
    const now = Date.now();
    if (now - lastMarked.current < 4000) return;
    lastMarked.current = now;
    await supabase
      .from('chat_reads')
      .upsert(
        { chain_id: chainId, user_id: user.id, last_read_at: new Date().toISOString() },
        { onConflict: 'chain_id,user_id' },
      );
  }, [user, chainId]);

  return { reads, markRead, reload: load };
}
