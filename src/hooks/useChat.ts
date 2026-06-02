import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { notifyEvent } from '@/lib/push';
import { useAuth } from '@/hooks/useAuth';
import type { ChatMessageRow, ChatMessageWithAuthor, UserRow } from '@/types';

// Newest slice kept in memory. Chains are small teams; if a stream ever grows
// past this, add "load older" pagination — not needed for v1.
const PAGE = 200;

export function useChat(chainId: string, members: UserRow[]) {
  const { user } = useAuth();
  // Unique per instance so two mounted chat panels never collide on the topic
  // (supabase-js reuses channels by name). See [[realtime-channel-uniqueness]].
  const channelId = useId();
  const [messages, setMessages] = useState<ChatMessageWithAuthor[]>([]);
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
    const { error } = await supabase.from('chat_messages').delete().eq('id', id);
    if (error) throw error;
  }, []);

  return { messages, loading, send, edit, remove, reload: load };
}
