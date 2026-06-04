import { useCallback, useEffect, useId, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { TodoAttachmentRow } from '@/types';

const BUCKET = 'todo-files';
const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Files / screenshots attached to one todo. Lists from `todo_attachments`,
 * uploads into the public `todo-files` bucket, and live-syncs via realtime
 * filtered by todo_id. Mirrors the chat file-upload flow (0024/0026).
 */
export function useTodoAttachments(todoId: string, chainId: string) {
  const { user } = useAuth();
  const channelId = useId();
  const [items, setItems] = useState<TodoAttachmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('todo_attachments')
      .select('*')
      .eq('todo_id', todoId)
      .order('created_at', { ascending: false });
    setItems((data ?? []) as TodoAttachmentRow[]);
    setLoading(false);
  }, [todoId]);

  useEffect(() => {
    void load();
    const ch = supabase
      .channel(`todo-attachments:${todoId}:${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todo_attachments', filter: `todo_id=eq.${todoId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch).catch(() => {});
    };
  }, [todoId, channelId, load]);

  const add = useCallback(
    async (file: File) => {
      if (!user) throw new Error('no-user');
      if (file.size > MAX_BYTES) {
        throw new Error(`Max 25 MB — yours is ${(file.size / 1048576).toFixed(1)} MB`);
      }
      const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_');
      const path = `${chainId}/${todoId}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: '3600', contentType: file.type || undefined });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { error } = await supabase.from('todo_attachments').insert({
        chain_id: chainId,
        todo_id: todoId,
        user_id: user.id,
        url: pub.publicUrl,
        name: file.name,
        type: file.type || null,
        size: file.size,
      });
      if (error) throw error;
    },
    [user, chainId, todoId],
  );

  const remove = useCallback(async (att: TodoAttachmentRow) => {
    const { error } = await supabase.from('todo_attachments').delete().eq('id', att.id);
    if (error) throw error;
    // Best-effort storage cleanup; the row is the source of truth.
    const marker = `/${BUCKET}/`;
    const idx = att.url.indexOf(marker);
    if (idx >= 0) {
      const objectPath = decodeURIComponent(att.url.slice(idx + marker.length));
      await supabase.storage.from(BUCKET).remove([objectPath]).catch(() => {});
    }
  }, []);

  return { items, loading, add, remove, reload: load };
}
