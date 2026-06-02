import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AtSign,
  Ban,
  BarChart3,
  Check,
  CheckCheck,
  CornerUpLeft,
  Copy,
  Download,
  File as FileIcon,
  Folder,
  Image as ImageIcon,
  Info,
  Loader2,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Pencil,
  Plus,
  Send,
  Smile,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { supabase } from '@/lib/supabase';
import { useChat } from '@/hooks/useChat';
import { useChatReads } from '@/hooks/useChatReads';
import { useChatPresence } from '@/hooks/useChatPresence';
import { usePolls } from '@/hooks/usePolls';
import { useAuth } from '@/hooks/useAuth';
import { useT, type TFn } from '@/lib/i18n';
import { cn, copyToClipboard, initials, relativeTime } from '@/lib/utils';
import { CHAT_REACTION_EMOJIS } from '@/types';
import type { ChatMessageWithAuthor, ChatPollRow, ChatPollVoteRow, ChatReactionRow, UserRow } from '@/types';

interface Props {
  chainId: string;
  members: UserRow[];
}

function shortTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface ProjectRef {
  id: string;
  name: string;
}

/** Position of an in-progress @mention at the cursor, for autocomplete. */
function detectMention(value: string, cursor: number): { query: string; start: number } | null {
  const before = value.slice(0, cursor);
  const m = /(?:^|\s)@(\w*)$/.exec(before);
  if (!m) return null;
  return { query: m[1], start: cursor - m[1].length - 1 };
}

/** Resolve `@username` tokens in the text to the mentioned members' ids. */
function parseMentionedUserIds(text: string, members: UserRow[]): string[] {
  const ids = new Set<string>();
  const re = /(?:^|\s)@(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const u = members.find((mem) => mem.username === m![1]);
    if (u) ids.add(u.id);
  }
  return [...ids];
}

/**
 * Render a message body into React nodes: **bold**, *italic*, `@username`
 * mentions and `@[Project Name]` links — never raw HTML.
 */
function renderBody(
  text: string,
  members: UserRow[],
  projects: ProjectRef[],
  onProject: (id: string) => void,
): React.ReactNode {
  const out: React.ReactNode[] = [];
  const re = /(@\[[^\]]+\]|@\w+|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('@[')) {
      const name = tok.slice(2, -1);
      const proj = projects.find((p) => p.name === name);
      out.push(
        proj ? (
          <button
            key={k++}
            type="button"
            onClick={() => onProject(proj.id)}
            className="inline-flex items-center gap-0.5 rounded-md border-2 border-current px-1 align-baseline text-xs font-bold underline decoration-2 hover:opacity-80"
          >
            <Folder className="h-3 w-3" />
            {name}
          </button>
        ) : (
          tok
        ),
      );
    } else if (tok.startsWith('@')) {
      const mem = members.find((x) => x.username === tok.slice(1));
      out.push(
        mem ? (
          <span key={k++} className="font-bold underline decoration-dotted">
            @{mem.display_name}
          </span>
        ) : (
          tok
        ),
      );
    } else if (tok.startsWith('**')) {
      out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    } else {
      out.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function ChatPanel({ chainId, members }: Props) {
  const { user } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const { messages, reactions, loading, send, sendFile, edit, remove, react } = useChat(chainId, members);
  const { reads, markRead } = useChatReads(chainId);
  const activeIds = useChatPresence(chainId);
  const { polls, votes, vote, createPoll } = usePolls(chainId);

  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessageWithAuthor | null>(null);
  const [sending, setSending] = useState(false);
  const [infoMsg, setInfoMsg] = useState<ChatMessageWithAuthor | null>(null);
  const [projects, setProjects] = useState<ProjectRef[]>([]);
  const [mention, setMention] = useState<{ query: string; start: number } | null>(null);
  const [mentionIdx, setMentionIdx] = useState(0);
  const [pollOpen, setPollOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function uploadFile(file: File) {
    if (file.size > 25 * 1024 * 1024) {
      toast.error(t('File too large'), {
        description: t('Max 25 MB — yours is {mb} MB', { mb: (file.size / 1048576).toFixed(1) }),
      });
      return;
    }
    try {
      await sendFile(file, replyTo?.id ?? null);
      setReplyTo(null);
    } catch (err) {
      toast.error(t('Could not send file'), { description: (err as Error).message });
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const item = Array.from(e.clipboardData.items).find((it) => it.type.startsWith('image/'));
    const file = item?.getAsFile();
    if (file) {
      e.preventDefault();
      void uploadFile(file);
    }
  }

  // The chain's projects, for @[project] autocomplete + link resolution.
  useEffect(() => {
    let active = true;
    supabase
      .from('projects')
      .select('id, name')
      .eq('chain_id', chainId)
      .then(({ data }) => {
        if (active) setProjects((data ?? []) as ProjectRef[]);
      });
    return () => {
      active = false;
    };
  }, [chainId]);

  const openProject = (projectId: string) => navigate(`/chain/${chainId}?project=${projectId}`);

  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const activeMembers = members.filter((mem) => activeIds.includes(mem.id));

  const suggestions = useMemo(() => {
    if (!mention)
      return [] as Array<{ kind: 'user' | 'project'; id: string; label: string; sub: string; insert: string }>;
    const q = mention.query.toLowerCase();
    const users = members
      .filter((m) => m.username.toLowerCase().includes(q) || m.display_name.toLowerCase().includes(q))
      .slice(0, 5)
      .map((m) => ({ kind: 'user' as const, id: m.id, label: m.display_name, sub: `@${m.username}`, insert: `@${m.username} ` }));
    const projs = projects
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map((p) => ({ kind: 'project' as const, id: p.id, label: p.name, sub: t('Project'), insert: `@[${p.name}] ` }));
    return [...users, ...projs].slice(0, 6);
  }, [mention, members, projects, t]);

  function onComposerChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setText(value);
    setMention(detectMention(value, e.target.selectionStart ?? value.length));
    setMentionIdx(0);
  }

  function applyMention(s: { insert: string }) {
    if (!mention) return;
    const ta = taRef.current;
    const cursor = ta ? ta.selectionStart : text.length;
    const before = text.slice(0, mention.start);
    const next = `${before}${s.insert}${text.slice(cursor)}`;
    setText(next);
    setMention(null);
    const pos = before.length + s.insert.length;
    requestAnimationFrame(() => {
      if (ta) {
        ta.focus();
        ta.selectionStart = pos;
        ta.selectionEnd = pos;
      }
    });
  }

  // Members (other than the author) whose last_read_at is at/after this message.
  const readersOf = (m: ChatMessageWithAuthor): UserRow[] => {
    const created = new Date(m.created_at).getTime();
    return members.filter((mem) => {
      if (mem.id === m.user_id) return false;
      const lr = reads.get(mem.id);
      return lr ? new Date(lr).getTime() >= created : false;
    });
  };

  // Stick to the bottom as new messages arrive.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  // Mark the chat read on mount and as messages arrive (throttled in the hook).
  useEffect(() => {
    void markRead();
  }, [messages.length, markRead]);

  async function onSend() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await send(body, replyTo?.id ?? null, parseMentionedUserIds(body, members));
      setText('');
      setReplyTo(null);
    } catch (err) {
      toast.error(t('Could not send message'), { description: (err as Error).message });
    } finally {
      setSending(false);
    }
  }

  // Wrap the current selection with a markdown marker (Ctrl/Cmd+B / +I).
  function wrapSelection(marker: string) {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) return; // nothing selected
    const next = `${text.slice(0, start)}${marker}${text.slice(start, end)}${marker}${text.slice(end)}`;
    setText(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + marker.length;
      ta.selectionEnd = end + marker.length;
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mention && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIdx((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applyMention(suggestions[mentionIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMention(null);
        return;
      }
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault();
      wrapSelection('**');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
      e.preventDefault();
      wrapSelection('*');
      return;
    }
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
    <section className="relative flex h-[calc(100dvh-8rem)] min-h-[22rem] flex-col overflow-hidden rounded-lg border-2 border-fg bg-surface shadow-brut">
      <header className="flex items-center gap-2 border-b-2 border-fg px-4 py-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-md border-2 border-fg bg-accent-violet text-white shadow-brut-sm">
          <MessageSquare className="h-4 w-4" />
        </span>
        <h2 className="font-display text-lg font-bold tracking-tight">{t('Chat')}</h2>
        <span className="font-mono text-xs text-fg-muted">{t('{n} members', { n: members.length })}</span>
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
                reactions={reactions.get(m.id) ?? []}
                currentUserId={user?.id ?? null}
                readers={m.user_id === user?.id ? readersOf(m) : []}
                members={members}
                projects={projects}
                onProject={openProject}
                poll={m.poll_id ? polls.get(m.poll_id) ?? null : null}
                pollVotes={m.poll_id ? votes.get(m.poll_id) ?? [] : []}
                onVote={(idx) => {
                  if (m.poll_id) void vote(m.poll_id, idx);
                }}
                onReact={(emoji) => react(m.id, emoji)}
                onReply={() => setReplyTo(m)}
                onEdit={onEdit}
                onDelete={onDelete}
                onInfo={() => setInfoMsg(m)}
                t={t}
              />
            ))}
            <div ref={bottomRef} />
          </ul>
        )}
      </div>

      {activeMembers.length > 0 ? (
        <div className="pointer-events-none absolute bottom-[4.5rem] left-3 z-10 flex -space-x-2">
          {activeMembers.slice(0, 5).map((mem) => (
            <Avatar
              key={mem.id}
              className="pointer-events-auto h-7 w-7 border-2 border-fg shadow-brut-sm ring-2 ring-surface"
              title={mem.display_name}
            >
              {mem.avatar_url ? <AvatarImage src={mem.avatar_url} alt={mem.display_name} /> : null}
              <AvatarFallback className="text-[9px]">{initials(mem.display_name)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      ) : null}

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

      {mention && suggestions.length > 0 ? (
        <div className="absolute inset-x-2 bottom-[4.5rem] z-20 overflow-hidden rounded-lg border-2 border-fg bg-surface shadow-brut">
          {suggestions.map((s, i) => (
            <button
              key={`${s.kind}-${s.id}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                applyMention(s);
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm',
                i === mentionIdx ? 'bg-surface-2' : 'hover:bg-surface-2',
              )}
            >
              {s.kind === 'project' ? (
                <Folder className="h-4 w-4 shrink-0 text-accent-violet" />
              ) : (
                <AtSign className="h-4 w-4 shrink-0 text-accent-blue" />
              )}
              <span className="truncate font-semibold text-fg">{s.label}</span>
              <span className="ml-auto shrink-0 truncate text-xs text-fg-muted">{s.sub}</span>
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSend();
        }}
        className="flex items-end gap-2 border-t-2 border-fg p-2.5 sm:p-3"
      >
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadFile(f);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileRef.current?.click()}
          aria-label={t('Attach a file')}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setPollOpen(true)}
          aria-label={t('Create poll')}
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
        <Textarea
          ref={taRef}
          value={text}
          onChange={onComposerChange}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          placeholder={t('Write a message…')}
          aria-label={t('Write a message…')}
          className="max-h-32 min-h-[44px] flex-1 text-sm"
          rows={1}
        />
        <Button type="submit" disabled={sending || text.trim().length === 0} aria-label={t('Send')}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>

      <Dialog open={Boolean(infoMsg)} onOpenChange={(o) => !o && setInfoMsg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Message info')}</DialogTitle>
          </DialogHeader>
          {infoMsg ? <MessageInfo message={infoMsg} members={members} reads={reads} t={t} /> : null}
        </DialogContent>
      </Dialog>

      <PollDialog open={pollOpen} onOpenChange={setPollOpen} onCreate={createPoll} t={t} />
    </section>
  );
}

function MessageInfo({
  message,
  members,
  reads,
  t,
}: {
  message: ChatMessageWithAuthor;
  members: UserRow[];
  reads: Map<string, string>;
  t: TFn;
}) {
  const created = new Date(message.created_at).getTime();
  const rows = members
    .filter((m) => m.id !== message.user_id)
    .map((m) => {
      const lr = reads.get(m.id);
      return { member: m, seen: lr ? new Date(lr).getTime() >= created : false, at: lr };
    })
    .sort((a, b) => Number(b.seen) - Number(a.seen));

  if (rows.length === 0) {
    return <p className="text-sm text-fg-muted">{t('No members yet.')}</p>;
  }

  return (
    <ul className="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
      {rows.map(({ member, seen, at }) => (
        <li key={member.id} className="flex items-center gap-2 rounded-md border-2 border-fg bg-surface p-2">
          <Avatar className="h-7 w-7">
            {member.avatar_url ? <AvatarImage src={member.avatar_url} alt={member.display_name} /> : null}
            <AvatarFallback className="text-[10px]">{initials(member.display_name)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">{member.display_name}</span>
          {seen ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs text-accent-blue">
              <CheckCheck className="h-3.5 w-3.5" /> {t('Seen')} {at ? relativeTime(at) : ''}
            </span>
          ) : (
            <span className="shrink-0 text-xs text-fg-muted">{t('Not seen')}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function PollCard({
  poll,
  votes,
  currentUserId,
  onVote,
  t,
}: {
  poll: ChatPollRow;
  votes: ChatPollVoteRow[];
  currentUserId: string | null;
  onVote: (optionIndex: number) => void;
  t: TFn;
}) {
  const total = votes.length;
  const myVote = votes.find((v) => v.user_id === currentUserId)?.option_index ?? null;
  return (
    <div className="flex min-w-[14rem] flex-col gap-1.5">
      <p className="flex items-center gap-1.5 text-sm font-bold">
        <BarChart3 className="h-4 w-4 shrink-0" />
        {poll.question}
      </p>
      {poll.options.map((opt, i) => {
        const count = votes.filter((v) => v.option_index === i).length;
        const pct = total ? Math.round((count / total) * 100) : 0;
        const mine = myVote === i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onVote(i)}
            className="relative overflow-hidden rounded-md border-2 border-current px-2 py-1 text-left text-xs"
          >
            <span className="absolute inset-y-0 left-0 bg-current opacity-15" style={{ width: `${pct}%` }} />
            <span className="relative flex items-center justify-between gap-2">
              <span className={cn('truncate', mine ? 'font-bold' : '')}>
                {mine ? '✓ ' : ''}
                {opt}
              </span>
              <span className="shrink-0 font-mono">{pct}%</span>
            </span>
          </button>
        );
      })}
      <p className="text-[10px] opacity-70">{t('{n} votes', { n: total })}</p>
    </div>
  );
}

function PollDialog({
  open,
  onOpenChange,
  onCreate,
  t,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (question: string, options: string[]) => Promise<void>;
  t: TFn;
}) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [busy, setBusy] = useState(false);

  const valid = question.trim().length > 0 && options.filter((o) => o.trim()).length >= 2;

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await onCreate(question, options);
      onOpenChange(false);
      setQuestion('');
      setOptions(['', '']);
    } catch (err) {
      toast.error(t('Could not create poll'), { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Create poll')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Input
            autoFocus
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('Ask a question')}
          />
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={opt}
                onChange={(e) => setOptions((prev) => prev.map((o, j) => (j === i ? e.target.value : o)))}
                placeholder={`${t('Option')} ${i + 1}`}
              />
              {options.length > 2 ? (
                <button
                  type="button"
                  onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={t('Delete')}
                  className="rounded-md p-1 text-fg-muted hover:text-fg"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
          {options.length < 6 ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setOptions((prev) => [...prev, ''])}>
              <Plus className="h-4 w-4" /> {t('Add option')}
            </Button>
          ) : null}
          <div className="mt-1 flex justify-end">
            <Button size="sm" onClick={submit} disabled={!valid || busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
              {t('Create poll')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface RowProps {
  message: ChatMessageWithAuthor;
  isOwn: boolean;
  repliedTo: ChatMessageWithAuthor | null;
  reactions: ChatReactionRow[];
  currentUserId: string | null;
  readers: UserRow[];
  members: UserRow[];
  projects: ProjectRef[];
  onProject: (id: string) => void;
  poll: ChatPollRow | null;
  pollVotes: ChatPollVoteRow[];
  onVote: (optionIndex: number) => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
  onInfo: () => void;
  t: TFn;
}

function MessageRow({
  message,
  isOwn,
  repliedTo,
  reactions,
  currentUserId,
  readers,
  members,
  projects,
  onProject,
  poll,
  pollVotes,
  onVote,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onInfo,
  t,
}: RowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const name = message.author?.display_name ?? t('Unknown');

  // Group this message's reactions by emoji -> { count, mine }.
  const grouped = useMemo(() => {
    const map = new Map<string, { count: number; mine: boolean }>();
    for (const r of reactions) {
      const cur = map.get(r.emoji) ?? { count: 0, mine: false };
      cur.count += 1;
      if (r.user_id === currentUserId) cur.mine = true;
      map.set(r.emoji, cur);
    }
    return [...map.entries()];
  }, [reactions, currentUserId]);

  if (message.deleted_at) {
    return (
      <li className={cn('flex px-1', isOwn ? 'justify-end' : 'justify-start')}>
        <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-dashed border-fg/40 bg-surface-2 px-3 py-1.5 text-xs italic text-fg-muted">
          <Ban className="h-3.5 w-3.5" />
          {t('deleted message')}
        </span>
      </li>
    );
  }

  async function copy() {
    const ok = await copyToClipboard(message.body ?? '');
    if (ok) toast.success(t('Copied to clipboard'));
  }

  async function copyImage() {
    if (!message.file_url) return;
    try {
      const res = await fetch(message.file_url);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast.success(t('Image copied'));
    } catch {
      toast.error(t('Could not copy image'));
    }
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
                {repliedTo && !repliedTo.deleted_at ? repliedTo.body ?? '🎤' : t('deleted message')}
              </p>
            </div>
          ) : null}

          {message.poll_id && poll ? (
            <PollCard poll={poll} votes={pollVotes} currentUserId={currentUserId} onVote={onVote} t={t} />
          ) : null}

          {message.file_url ? (
            message.file_type?.startsWith('image/') ? (
              <a href={message.file_url} target="_blank" rel="noreferrer" className="mb-1 block">
                <img
                  src={message.file_url}
                  alt={message.file_name ?? ''}
                  className="max-h-64 max-w-full rounded-md border-2 border-fg object-cover"
                />
              </a>
            ) : (
              <a
                href={message.file_url}
                target="_blank"
                rel="noreferrer"
                className="mb-1 flex items-center gap-2 rounded-md border-2 border-fg bg-surface px-2 py-1.5 text-fg"
              >
                <FileIcon className="h-5 w-5 shrink-0 text-accent-violet" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{message.file_name}</span>
                  {message.file_size ? (
                    <span className="block text-xs text-fg-muted">{Math.round(message.file_size / 1024)} KB</span>
                  ) : null}
                </span>
                <Download className="h-4 w-4 shrink-0" />
              </a>
            )
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
                <button type="button" onClick={() => setEditing(false)} className="rounded-md p-1 hover:bg-black/10" aria-label={t('Cancel')}>
                  <X className="h-4 w-4" />
                </button>
                <button type="button" onClick={saveEdit} className="rounded-md p-1 hover:bg-black/10" aria-label={t('Save')}>
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : message.body ? (
            <p className="whitespace-pre-wrap break-words text-sm">
              {renderBody(message.body, members, projects, onProject)}
            </p>
          ) : !message.file_url && !message.poll_id ? (
            <p className="whitespace-pre-wrap break-words text-sm">🎤</p>
          ) : null}

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

        {grouped.length > 0 ? (
          <div className={cn('mt-1 flex flex-wrap gap-1', isOwn ? 'justify-end' : 'justify-start')}>
            {grouped.map(([emoji, { count, mine }]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onReact(emoji)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border-2 border-fg px-1.5 py-0.5 text-xs font-bold shadow-brut-sm transition-colors',
                  mine ? 'bg-accent-blue text-white' : 'bg-surface text-fg hover:bg-surface-2',
                )}
              >
                <span>{emoji}</span>
                <span className="font-mono">{count}</span>
              </button>
            ))}
          </div>
        ) : null}

        {isOwn && readers.length > 0 ? (
          <button
            type="button"
            onClick={onInfo}
            className="mt-1 flex items-center gap-1 text-[10px] text-fg-muted hover:text-fg"
            aria-label={t('Information')}
          >
            <CheckCheck className="h-3 w-3 text-accent-blue" />
            <span className="flex -space-x-1">
              {readers.slice(0, 3).map((r) => (
                <Avatar key={r.id} className="h-4 w-4 ring-1 ring-surface">
                  {r.avatar_url ? <AvatarImage src={r.avatar_url} alt={r.display_name} /> : null}
                  <AvatarFallback className="text-[7px]">{initials(r.display_name)}</AvatarFallback>
                </Avatar>
              ))}
            </span>
            {readers.length > 3 ? <span>+{readers.length - 3}</span> : null}
          </button>
        ) : null}
      </div>

      {!editing ? (
        <div className="mb-1 flex items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover/msg:opacity-100">
          <DropdownMenu open={pickerOpen} onOpenChange={setPickerOpen}>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label={t('React')} className="rounded-md p-1 text-fg-muted hover:bg-surface-2 hover:text-fg">
                <Smile className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isOwn ? 'end' : 'start'} className="flex gap-1 p-1.5">
              {CHAT_REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onReact(emoji);
                    setPickerOpen(false);
                  }}
                  className="grid h-8 w-8 place-items-center rounded-md text-lg transition-transform hover:scale-125 hover:bg-surface-2"
                >
                  {emoji}
                </button>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label={t('Message actions')} className="rounded-md p-1 text-fg-muted hover:bg-surface-2 hover:text-fg">
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
              {message.file_type?.startsWith('image/') && message.file_url ? (
                <DropdownMenuItem onSelect={() => void copyImage()}>
                  <ImageIcon className="h-4 w-4" />
                  {t('Copy image')}
                </DropdownMenuItem>
              ) : null}
              {isOwn ? (
                <DropdownMenuItem onSelect={onInfo}>
                  <Info className="h-4 w-4" />
                  {t('Information')}
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
        </div>
      ) : null}
    </li>
  );
}
