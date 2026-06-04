import { useCallback, useEffect, useId, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface ChatUnread {
  /** Unread messages from others (created after my last_read_at). */
  total: number;
  /** Unread @-mentions of me — drives the distinct "@" alert. */
  mentions: number;
}

/**
 * Unread chat state for the Chat tab: a total count of messages from others
 * newer than my last_read_at, plus how many of those mention me. Opening the
 * chat bumps last_read_at, which clears both. Runs at the chain-page level so
 * the badge shows from any tab. Supersedes the mentions-only hook.
 */
export function useChatUnread(chainId: string | undefined): ChatUnread {
  const { user } = useAuth();
  const channelId = useId();
  const [state, setState] = useState<ChatUnread>({ total: 0, mentions: 0 });

  const compute = useCallback(async () => {
    if (!chainId || !user) {
      setState({ total: 0, mentions: 0 });
      return;
    }
    const { data: read } = await supabase
      .from('chat_reads')
      .select('last_read_at')
      .eq('chain_id', chainId)
      .eq('user_id', user.id)
      .maybeSingle();
    const lastReadIso = read?.last_read_at ?? '1970-01-01T00:00:00Z';
    const lastRead = read?.last_read_at ? new Date(read.last_read_at).getTime() : 0;

    const [{ count }, { data: mentions }] = await Promise.all([
      supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('chain_id', chainId)
        .neq('user_id', user.id)
        .is('deleted_at', null)
        .gt('created_at', lastReadIso),
      supabase
        .from('chat_mentions')
        .select('created_at')
        .eq('chain_id', chainId)
        .eq('user_id', user.id),
    ]);
    const mentionCount = ((mentions ?? []) as Array<{ created_at: string }>).filter(
      (m) => new Date(m.created_at).getTime() > lastRead,
    ).length;
    setState({ total: count ?? 0, mentions: mentionCount });
  }, [chainId, user]);

  useEffect(() => {
    if (!chainId || !user) return;
    void compute();
    const ch = supabase
      .channel(`chat-unread:${chainId}:${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `chain_id=eq.${chainId}` },
        () => void compute(),
      )
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

  return state;
}
