import { Bell, CheckCheck, MessageSquare, CheckCircle2, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useNotifications } from '@/hooks/useNotifications';
import { useT } from '@/lib/i18n';
import { cn, initials, relativeTime } from '@/lib/utils';
import type { NotificationType, NotificationWithActor } from '@/types';

function TypeIcon({ type, className }: { type: NotificationType; className?: string }) {
  if (type === 'comment') return <MessageSquare className={className} />;
  if (type === 'todo_done') return <CheckCircle2 className={className} />;
  if (type === 'member_join') return <UserPlus className={className} />;
  return <Bell className={className} />;
}

export function NotificationBell({ className }: { className?: string }) {
  const t = useT();
  const navigate = useNavigate();
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications();

  function open(n: NotificationWithActor) {
    if (!n.read) void markRead(n.id);
    if (n.link) navigate(n.link);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('Notifications')}
          className={cn(
            'relative inline-grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 border-fg bg-surface text-fg shadow-brut-sm',
            'active:translate-x-[2px] active:translate-y-[2px] transition-transform',
            className,
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 grid min-w-[1.15rem] place-items-center rounded-full border-2 border-fg bg-accent-rose px-1 text-[10px] font-bold leading-none text-white font-mono">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[min(20rem,calc(100vw-1.5rem))] p-0">
        <div className="flex items-center justify-between gap-2 border-b-2 border-fg px-3 py-2">
          <p className="font-display text-sm font-bold text-fg">{t('Notifications')}</p>
          {unreadCount > 0 ? (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => void markAllRead()}>
              <CheckCheck className="h-3.5 w-3.5" />
              {t('Mark all read')}
            </Button>
          ) : null}
        </div>

        <div className="max-h-[min(24rem,70vh)] overflow-y-auto">
          {loading ? (
            <p className="px-3 py-6 text-center text-sm text-fg-muted">{t('Loading…')}</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-fg-muted">{t('No notifications yet')}</p>
          ) : (
            items.map((n, i) => (
              <div key={n.id}>
                {i > 0 ? <DropdownMenuSeparator className="my-0" /> : null}
                <button
                  type="button"
                  onClick={() => open(n)}
                  className={cn(
                    'flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-surface-2',
                    !n.read && 'bg-surface-2/60',
                  )}
                >
                  <span className="relative mt-0.5">
                    <Avatar className="h-8 w-8">
                      {n.actor?.avatar_url ? (
                        <AvatarImage src={n.actor.avatar_url} alt={n.actor.display_name} />
                      ) : null}
                      <AvatarFallback>{initials(n.actor?.display_name ?? '?')}</AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full border-2 border-fg bg-surface">
                      <TypeIcon type={n.type} className="h-2.5 w-2.5 text-fg" />
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-bold text-fg">{t(n.title)}</span>
                      {!n.read ? <span className="h-2 w-2 shrink-0 rounded-full bg-accent-blue" /> : null}
                    </span>
                    {n.body ? <span className="block truncate text-xs text-fg-muted">{n.body}</span> : null}
                    <span className="block text-[11px] text-fg-muted font-mono">{relativeTime(n.created_at)}</span>
                  </span>
                </button>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
