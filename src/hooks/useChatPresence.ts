import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

/**
 * Who is currently looking at this chain's chat. A dedicated presence channel
 * (`chat-presence:<chainId>`) separate from the chain-wide presence channel.
 * The topic is intentionally shared (NOT per-instance) so participants see each
 * other — and ChatPanel mounts only once per client, so there is no same-client
 * duplicate-topic collision. Returns the set of present user ids.
 */
export function useChatPresence(chainId: string): string[] {
  const { user } = useAuth();
  const [activeIds, setActiveIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`chat-presence:${chainId}`, {
      config: { presence: { key: user.id } },
    });

    const recompute = () => setActiveIds(Object.keys(channel.presenceState()));

    channel.on('presence', { event: 'sync' }, recompute);
    channel.on('presence', { event: 'join' }, recompute);
    channel.on('presence', { event: 'leave' }, recompute);

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
      }
    });

    return () => {
      channel.untrack().catch(() => {});
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [chainId, user]);

  return activeIds;
}
