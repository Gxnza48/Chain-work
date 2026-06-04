import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface ChatPresence {
  /** User ids currently looking at this chain's chat (includes self). */
  activeIds: string[];
  /** User ids currently composing a message (never includes self). */
  typingIds: string[];
  /** Broadcast my own typing state to the other participants. */
  setTyping: (typing: boolean) => void;
}

/**
 * Presence + typing for a chain's chat over one shared channel
 * (`chat-presence:<chainId>`). Presence tracks who's looking; a lightweight
 * `typing` broadcast (not presence state, to avoid a re-sync per keystroke)
 * drives the "… is typing" line. The topic is intentionally shared (NOT
 * per-instance) so participants see each other, and ChatPanel mounts once per
 * client, so there's no same-client duplicate-topic collision.
 */
export function useChatPresence(chainId: string): ChatPresence {
  const { user } = useAuth();
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [typingIds, setTypingIds] = useState<string[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`chat-presence:${chainId}`, {
      config: { presence: { key: user.id } },
    });
    channelRef.current = channel;
    const timers = typingTimers.current;

    const recompute = () => setActiveIds(Object.keys(channel.presenceState()));
    channel.on('presence', { event: 'sync' }, recompute);
    channel.on('presence', { event: 'join' }, recompute);
    channel.on('presence', { event: 'leave' }, recompute);

    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      const id = (payload as { userId?: string; typing?: boolean })?.userId;
      const typing = (payload as { typing?: boolean })?.typing;
      if (!id || id === user.id) return;
      setTypingIds((prev) => {
        const has = prev.includes(id);
        if (typing && !has) return [...prev, id];
        if (!typing && has) return prev.filter((x) => x !== id);
        return prev;
      });
      // Self-heal if a "stopped typing" event is ever dropped.
      const existing = timers.get(id);
      if (existing) clearTimeout(existing);
      if (typing) {
        timers.set(
          id,
          setTimeout(() => {
            setTypingIds((prev) => prev.filter((x) => x !== id));
            timers.delete(id);
          }, 5000),
        );
      } else {
        timers.delete(id);
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
      }
    });

    return () => {
      timers.forEach((tm) => clearTimeout(tm));
      timers.clear();
      channel.untrack().catch(() => {});
      supabase.removeChannel(channel).catch(() => {});
      channelRef.current = null;
    };
  }, [chainId, user]);

  const setTyping = useCallback(
    (typing: boolean) => {
      const ch = channelRef.current;
      if (!ch || !user) return;
      void ch.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id, typing } });
    },
    [user],
  );

  return { activeIds, typingIds, setTyping };
}
