import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { notifyEvent } from '@/lib/push';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/lib/i18n';
import { cn, initials, relativeTime } from '@/lib/utils';
import type { CommentWithAuthor, UserRow } from '@/types';

interface Props {
  chainId: string;
  todoId: string;
  members: UserRow[];
  /** Bubbles the live count up to the TodoItem badge. */
  onCountChange?: (n: number) => void;
}

export function CommentThread({ chainId, todoId, members, onCountChange }: Props) {
  const { user } = useAuth();
  const t = useT();
  const channelId = useId();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('todo_id', todoId)
      .order('created_at', { ascending: true });
    if (error) {
      toast.error(t('Could not load comments'), { description: error.message });
      setLoading(false);
      return;
    }
    const memberMap = new Map(members.map((m) => [m.id, m]));
    const enriched: CommentWithAuthor[] = (data ?? []).map((c) => {
      const a = memberMap.get(c.user_id) ?? null;
      return {
        ...c,
        author: a
          ? { id: a.id, display_name: a.display_name, username: a.username, avatar_url: a.avatar_url }
          : null,
      };
    });
    setComments(enriched);
    onCountChange?.(enriched.length);
    setLoading(false);
  }, [todoId, members, onCountChange, t]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`comments:${todoId}:${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `todo_id=eq.${todoId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todoId]);

  async function post() {
    const text = body.trim();
    if (!user || !text || posting) return;
    setPosting(true);
    const { data, error } = await supabase
      .from('comments')
      .insert({ chain_id: chainId, todo_id: todoId, user_id: user.id, body: text })
      .select('id')
      .single();
    setPosting(false);
    if (error) {
      toast.error(t('Could not post comment'), { description: error.message });
      return;
    }
    setBody('');
    void notifyEvent('comment', { id: data.id });
    load();
  }

  async function remove(id: string) {
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) {
      toast.error(t('Could not delete comment'), { description: error.message });
      return;
    }
    load();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter posts; Shift+Enter newlines.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      post();
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-3 border-t-2 border-dashed border-fg/30 pt-3">
      {loading ? (
        <p className="text-sm text-fg-muted">{t('Loading…')}</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-fg-muted">{t('No comments yet. Start the conversation.')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => {
            const mine = c.user_id === user?.id;
            const name = c.author?.display_name ?? t('Unknown');
            return (
              <li key={c.id} className="group/comment flex items-start gap-2">
                <Avatar className="mt-0.5 h-7 w-7 shrink-0 ring-2 ring-surface">
                  {c.author?.avatar_url ? (
                    <AvatarImage src={c.author.avatar_url} alt={name} />
                  ) : null}
                  <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-fg">{name}</span>
                    <span className="text-xs text-fg-muted">{relativeTime(c.created_at)}</span>
                    {mine ? (
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        aria-label={t('Delete comment')}
                        className="ml-auto rounded-md p-1 text-fg-muted opacity-100 transition-colors hover:bg-accent-rose/10 hover:text-accent-rose sm:opacity-0 sm:group-hover/comment:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-fg">{c.body}</p>
                </div>
              </li>
            );
          })}
          <div ref={endRef} />
        </ul>
      )}

      <div className="flex items-end gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('Write a comment…')}
          aria-label={t('Write a comment…')}
          className={cn('min-h-[44px] flex-1 text-sm')}
          rows={1}
        />
        <Button
          size="sm"
          onClick={post}
          disabled={posting || body.trim().length === 0}
          aria-label={t('Post comment')}
        >
          {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
