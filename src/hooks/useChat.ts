import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { notifyEvent } from '@/lib/push';
import { useAuth } from '@/hooks/useAuth';
import type { ChatMessageRow, ChatMessageWithAuthor, ChatReactionRow, UserRow } from '@/types';

// Newest slice kept in memory. Chains are small teams; if a stream ever grows
// past this, add "load older" pagination — not needed for v1.
const PAGE = 200;

function groupReactions(rows: ChatReactionRow[]): Map<string, ChatReactionRow[]> {
  const map = new Map<string, ChatReactionRow[]>();
  for (const r of rows) {
    const arr = map.get(r.message_id) ?? [];
    arr.push(r);
    map.set(r.message_id, arr);
  }
  return map;
}

export function useChat(chainId: string, members: UserRow[]) {
  const { user } = useAuth();
  // Unique per instance so two mounted chat panels never collide on the topic
  // (supabase-js reuses channels by name). See [[realtime-channel-uniqueness]].
  const channelId = useId();
  const [messages, setMessages] = useState<ChatMessageWithAuthor[]>([]);
  const [reactions, setReactions] = useState<Map<string, ChatReactionRow[]>>(new Map());
  const [loading, setLoading] = useState(true);

  // Author resolution reads the latest members without re-subscribing realtime.
  const membersRef = useRef(members);
  membersRef.current = members;

  const resolve = useCallback((row: ChatMessageRow): ChatMessageWithAuthor => {
    const a = membersRef.current.find((m) => m.id === row.user_id) ?? null;
    return {
      ...row,
      author: a
        ? { id: a.id, display_name: a.display_name, username: a.username, avatar_url: a.avatar_url }
        : null,
    };
  }, []);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chain_id', chainId)
      .order('created_at', { ascending: false })
      .limit(PAGE);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[useChat] load failed', error.message);
      setLoading(false);
      return;
    }
    const rows = ((data ?? []) as ChatMessageRow[]).reverse(); // oldest -> newest
    setMessages(rows.map(resolve));

    const { data: rx } = await supabase.from('chat_reactions').select('*').eq('chain_id', chainId);
    setReactions(groupReactions((rx ?? []) as ChatReactionRow[]));
    setLoading(false);
  }, [chainId, resolve]);

  useEffect(() => {
    setLoading(true);
    void load();
    const ch = supabase
      .channel(`chat:${chainId}:${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chain_id=eq.${chainId}` },
        (payload) => {
          const row = payload.new as ChatMessageRow;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, resolve(row)]));
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `chain_id=eq.${chainId}` },
        (payload) => {
          const row = payload.new as ChatMessageRow;
          setMessages((prev) => prev.map((m) => (m.id === row.id ? resolve(row) : m)));
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages', filter: `chain_id=eq.${chainId}` },
        (payload) => {
          const old = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_reactions', filter: `chain_id=eq.${chainId}` },
        (payload) => {
          const r = payload.new as ChatReactionRow;
          setReactions((prev) => {
            const arr = prev.get(r.message_id) ?? [];
            if (arr.some((x) => x.user_id === r.user_id && x.emoji === r.emoji)) return prev;
            const next = new Map(prev);
            next.set(r.message_id, [...arr, r]);
            return next;
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_reactions', filter: `chain_id=eq.${chainId}` },
        (payload) => {
          const old = payload.old as { message_id: string; user_id: string; emoji: string };
          setReactions((prev) => {
            const arr = prev.get(old.message_id);
            if (!arr) return prev;
            const next = new Map(prev);
            next.set(old.message_id, arr.filter((x) => !(x.user_id === old.user_id && x.emoji === old.emoji)));
            return next;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch).catch(() => {});
    };
  }, [chainId, channelId, load, resolve]);

  const send = useCallback(
    async (body: string, replyTo?: string | null) => {
      const text = body.trim();
      if (!user || !text) return;
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ chain_id: chainId, user_id: user.id, body: text, reply_to: replyTo ?? null })
        .select('id')
        .single();
      if (error) throw error;
      // Optimistic append so the sender sees it instantly; the realtime INSERT
      // echo is de-duped by id (see the INSERT handler), so this never doubles.
      const row: ChatMessageRow = {
        id: data.id,
        chain_id: chainId,
        user_id: user.id,
        body: text,
        audio_url: null,
        audio_duration: null,
        reply_to: replyTo ?? null,
        edited_at: null,
        deleted_at: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, resolve(row)]));
      // Fire-and-forget web push to the other chain members.
      void notifyEvent('chat', { id: data.id });
    },
    [user, chainId, resolve],
  );

  const edit = useCallback(async (id: string, body: string) => {
    const text = body.trim();
    if (!text) return;
    const { error } = await supabase
      .from('chat_messages')
      .update({ body: text, edited_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }, []);

  const remove = useCallback(async (id: string) => {
    // Soft delete: keep the row as a tombstone for everyone, drop its content.
    const { error } = await supabase
      .from('chat_messages')
      .update({ deleted_at: new Date().toISOString(), body: null })
      .eq('id', id);
    if (error) throw error;
  }, []);

  const react = useCallback(
    async (messageId: string, emoji: string) => {
      if (!user) return;
      const mine = (reactions.get(messageId) ?? []).some(
        (r) => r.user_id === user.id && r.emoji === emoji,
      );
      if (mine) {
        await supabase
          .from('chat_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .eq('emoji', emoji);
      } else {
        await supabase
          .from('chat_reactions')
          .insert({ message_id: messageId, user_id: user.id, chain_id: chainId, emoji });
      }
    },
    [user, chainId, reactions],
  );

  return { messages, reactions, loading, send, edit, remove, react, reload: load };
}
