import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CornerUpLeft,
  Copy,
  Loader2,
  MessageSquare,
  MoreVertical,
  Pencil,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { useT, type TFn } from '@/lib/i18n';
import { cn, copyToClipboard, initials } from '@/lib/utils';
import type { ChatMessageWithAuthor, UserRow } from '@/types';

interface Props {
  chainId: string;
  members: UserRow[];
}

function shortTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatPanel({ chainId, members }: Props) {
  const { user } = useAuth();
  const t = useT();
  const { messages, loading, send, edit, remove } = useChat(chainId, members);

  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessageWithAuthor | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  // Stick to the bottom as new messages arrive.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  async function onSend() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await send(body, replyTo?.id ?? null);
      setText('');
      setReplyTo(null);
    } catch (err) {
      toast.error(t('Could not send message'), { description: (err as Error).message });
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void onSend();
    }
  }

  async function onEdit(id: string, body: string) {
    try {
      await edit(id, body);
    } catch (err) {
      toast.error(t('Could not edit message'), { description: (err as Error).message });
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm(t('Delete this message?'))) return;
    try {
      await remove(id);
    } catch (err) {
      toast.error(t('Could not delete message'), { description: (err as Error).message });
    }
  }

  return (
    <section className="flex h-[calc(100dvh-8rem)] min-h-[22rem] flex-col overflow-hidden rounded-lg border-2 border-fg bg-surface shadow-brut">
      <header className="flex items-center gap-2 border-b-2 border-fg px-4 py-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-md border-2 border-fg bg-accent-violet text-white shadow-brut-sm">
          <MessageSquare className="h-4 w-4" />
        </span>
        <h2 className="font-display text-lg font-bold tracking-tight">{t('Chat')}</h2>
        <span className="font-mono text-xs text-fg-muted">
          {t('{n} members', { n: members.length })}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4">
        {loading ? (
          <p className="text-center text-sm text-fg-muted">{t('Loading…')}</p>
        ) : messages.length === 0 ? (
          <div className="grid h-full place-items-center">
            <p className="text-sm text-fg-muted">{t('No messages yet. Say hi 👋')}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {messages.map((m) => (
              <MessageRow
                key={m.id}
                message={m}
                isOwn={m.user_id === user?.id}
                repliedTo={m.reply_to ? byId.get(m.reply_to) ?? null : null}
                onReply={() => setReplyTo(m)}
                onEdit={onEdit}
                onDelete={onDelete}
                t={t}
              />
            ))}
            <div ref={bottomRef} />
          </ul>
        )}
      </div>

      {replyTo ? (
        <div className="flex items-center gap-2 border-t-2 border-dashed border-fg/30 bg-surface-2 px-3 py-1.5 sm:px-4">
          <CornerUpLeft className="h-4 w-4 shrink-0 text-accent-violet" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-fg">
              {t('Replying to {name}', { name: replyTo.author?.display_name ?? t('Unknown') })}
            </p>
            <p className="truncate text-xs text-fg-muted">{replyTo.body ?? '🎤'}</p>
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            aria-label={t('Cancel')}
            className="rounded-md p-1 text-fg-muted hover:bg-surface hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSend();
        }}
        className="flex items-end gap-2 border-t-2 border-fg p-2.5 sm:p-3"
      >
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('Write a message…')}
          aria-label={t('Write a message…')}
          className="max-h-32 min-h-[44px] flex-1 text-sm"
          rows={1}
        />
        <Button type="submit" disabled={sending || text.trim().length === 0} aria-label={t('Send')}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </section>
  );
}

interface RowProps {
  message: ChatMessageWithAuthor;
  isOwn: boolean;
  repliedTo: ChatMessageWithAuthor | null;
  onReply: () => void;
  onEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
  t: TFn;
}

function MessageRow({ message, isOwn, repliedTo, onReply, onEdit, onDelete, t }: RowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body ?? '');
  const name = message.author?.display_name ?? t('Unknown');

  async function copy() {
    const ok = await copyToClipboard(message.body ?? '');
    if (ok) toast.success(t('Copied to clipboard'));
  }

  function saveEdit() {
    const next = draft.trim();
    if (next && next !== message.body) onEdit(message.id, next);
    setEditing(false);
  }

  return (
    <li className={cn('group/msg flex items-end gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {!isOwn ? (
        <Avatar className="h-7 w-7 shrink-0 ring-2 ring-surface">
          {message.author?.avatar_url ? <AvatarImage src={message.author.avatar_url} alt={name} /> : null}
          <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
        </Avatar>
      ) : null}

      <div className={cn('flex max-w-[78%] flex-col', isOwn ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-lg border-2 border-fg px-3 py-2 shadow-brut-sm',
            isOwn ? 'bg-accent-blue text-white' : 'bg-surface-2 text-fg',
          )}
        >
          {!isOwn ? <p className="mb-0.5 text-xs font-bold text-accent-violet">{name}</p> : null}

          {message.reply_to ? (
            <div
              className={cn(
                'mb-1 rounded-md border-l-4 px-2 py-1 text-xs',
                isOwn ? 'border-white/70 bg-white/15' : 'border-accent-violet bg-fg/5',
              )}
            >
              <p className="font-bold">{repliedTo?.author?.display_name ?? t('Unknown')}</p>
              <p className={cn('truncate', isOwn ? 'text-white/80' : 'text-fg-muted')}>
                {repliedTo ? repliedTo.body ?? '🎤' : t('deleted message')}
              </p>
            </div>
          ) : null}

          {editing ? (
            <div className="flex flex-col gap-1.5">
              <Textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit();
                  }
                  if (e.key === 'Escape') setEditing(false);
                }}
                rows={2}
                className="min-w-[12rem] text-sm text-fg"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-md p-1 hover:bg-black/10"
                  aria-label={t('Cancel')}
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="rounded-md p-1 hover:bg-black/10"
                  aria-label={t('Save')}
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm">{message.body ?? '🎤'}</p>
          )}

          <div
            className={cn(
              'mt-1 flex items-center gap-1 text-[10px] font-mono',
              isOwn ? 'justify-end text-white/70' : 'text-fg-muted',
            )}
          >
            <span>{shortTime(message.created_at)}</span>
            {message.edited_at ? <span>· {t('edited')}</span> : null}
          </div>
        </div>
      </div>

      {!editing ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t('Message actions')}
              className="mb-1 rounded-md p-1 text-fg-muted opacity-100 transition-opacity hover:bg-surface-2 hover:text-fg sm:opacity-0 sm:group-hover/msg:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isOwn ? 'end' : 'start'}>
            <DropdownMenuItem onSelect={onReply}>
              <CornerUpLeft className="h-4 w-4" />
              {t('Reply')}
            </DropdownMenuItem>
            {message.body ? (
              <DropdownMenuItem onSelect={() => void copy()}>
                <Copy className="h-4 w-4" />
                {t('Copy')}
              </DropdownMenuItem>
            ) : null}
            {isOwn && message.body ? (
              <DropdownMenuItem
                onSelect={() => {
                  setDraft(message.body ?? '');
                  setEditing(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                {t('Edit')}
              </DropdownMenuItem>
            ) : null}
            {isOwn ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onDelete(message.id)}>
                  <Trash2 className="h-4 w-4" />
                  {t('Delete')}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </li>
  );
}
