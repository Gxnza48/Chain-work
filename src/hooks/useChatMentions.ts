import { useCallback, useEffect, useId, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

/**
 * Count of UNREAD @-mentions of the current user in this chain's chat — drives
 * the red alert on the Chat tab. A mention is unread when its created_at is newer
 * than my chat_reads.last_read_at (so opening the chat, which bumps last_read,
 * clears it). Runs at the chain-page level so the badge shows from any tab.
 */
export function useChatMentions(chainId: string | undefined): number {
  const { user } = useAuth();
  const channelId = useId();
  const [unread, setUnread] = useState(0);

  const compute = useCallback(async () => {
    if (!chainId || !user) {
      setUnread(0);
      return;
    }
    const [{ data: read }, { data: mentions }] = await Promise.all([
      supabase
        .from('chat_reads')
        .select('last_read_at')
        .eq('chain_id', chainId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('chat_mentions')
        .select('created_at')
        .eq('chain_id', chainId)
        .eq('user_id', user.id),
    ]);
    const lastRead = read?.last_read_at ? new Date(read.last_read_at).getTime() : 0;
    const count = ((mentions ?? []) as Array<{ created_at: string }>).filter(
      (m) => new Date(m.created_at).getTime() > lastRead,
    ).length;
    setUnread(count);
  }, [chainId, user]);

  useEffect(() => {
    if (!chainId || !user) return;
    void compute();
    const ch = supabase
      .channel(`chat-mentions:${chainId}:${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_mentions', filter: `user_id=eq.${user.id}` },
        () => void compute(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_reads', filter: `chain_id=eq.${chainId}` },
        () => void compute(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch).catch(() => {});
    };
  }, [chainId, channelId, compute, user]);

  return unread;
}
