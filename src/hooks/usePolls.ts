import { useCallback, useEffect, useId, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { notifyEvent } from '@/lib/push';
import { useAuth } from '@/hooks/useAuth';
import type { ChatPollRow, ChatPollVoteRow } from '@/types';

/**
 * Chat polls: loads the chain's polls + votes, keeps them live, and exposes
 * single-choice voting (upsert) + poll creation (a chat_polls row + a poll
 * chat_messages row that useChat's realtime then renders).
 */
export function usePolls(chainId: string) {
  const { user } = useAuth();
  const channelId = useId();
  const [polls, setPolls] = useState<Map<string, ChatPollRow>>(new Map());
  const [votes, setVotes] = useState<Map<string, ChatPollVoteRow[]>>(new Map());

  const load = useCallback(async () => {
    const [{ data: pollRows }, { data: voteRows }] = await Promise.all([
      supabase.from('chat_polls').select('*').eq('chain_id', chainId),
      supabase.from('chat_poll_votes').select('*').eq('chain_id', chainId),
    ]);
    setPolls(new Map(((pollRows ?? []) as ChatPollRow[]).map((p) => [p.id, p])));
    const vmap = new Map<string, ChatPollVoteRow[]>();
    for (const v of (voteRows ?? []) as ChatPollVoteRow[]) {
      const arr = vmap.get(v.poll_id) ?? [];
      arr.push(v);
      vmap.set(v.poll_id, arr);
    }
    setVotes(vmap);
  }, [chainId]);

  useEffect(() => {
    void load();
    const ch = supabase
      .channel(`chat-polls:${chainId}:${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_polls', filter: `chain_id=eq.${chainId}` },
        (payload) => {
          const p = payload.new as ChatPollRow;
          setPolls((prev) => {
            const next = new Map(prev);
            next.set(p.id, p);
            return next;
          });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_poll_votes', filter: `chain_id=eq.${chainId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch).catch(() => {});
    };
  }, [chainId, channelId, load]);

  const vote = useCallback(
    async (pollId: string, optionIndex: number) => {
      if (!user) return;
      await supabase
        .from('chat_poll_votes')
        .upsert(
          { poll_id: pollId, user_id: user.id, chain_id: chainId, option_index: optionIndex },
          { onConflict: 'poll_id,user_id' },
        );
    },
    [user, chainId],
  );

  const createPoll = useCallback(
    async (question: string, options: string[]) => {
      if (!user) return;
      const clean = options.map((o) => o.trim()).filter(Boolean);
      if (!question.trim() || clean.length < 2) return;
      const { data: poll, error } = await supabase
        .from('chat_polls')
        .insert({ chain_id: chainId, question: question.trim(), options: clean, created_by: user.id })
        .select('id')
        .single();
      if (error) throw error;
      const { data: msg, error: msgErr } = await supabase
        .from('chat_messages')
        .insert({ chain_id: chainId, user_id: user.id, body: null, poll_id: poll.id })
        .select('id')
        .single();
      if (msgErr) throw msgErr;
      void notifyEvent('chat', { id: msg.id });
    },
    [user, chainId],
  );

  return { polls, votes, vote, createPoll };
}
