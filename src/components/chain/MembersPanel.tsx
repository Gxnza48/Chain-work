import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { PresenceBadge } from './PresenceBadge';
import { usePresence } from '@/hooks/usePresence';
import { useRelativeTimeTick } from '@/hooks/useRelativeTimeTick';
import { initials, relativeTime } from '@/lib/utils';
import type { UserRow } from '@/types';

interface Props {
  chainId: string;
  members: UserRow[];
}

export function MembersPanel({ chainId, members }: Props) {
  const { isOnline } = usePresence(chainId);
  useRelativeTimeTick();

  const sorted = [...members].sort((a, b) => {
    const ao = isOnline(a.id);
    const bo = isOnline(b.id);
    if (ao !== bo) return ao ? -1 : 1;
    return a.display_name.localeCompare(b.display_name);
  });

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-fg-muted">Members</h2>
        <p className="mt-0.5 text-xs text-fg-muted">{members.length} total</p>
      </div>
      <ul className="mt-3 flex-1 overflow-y-auto px-2 pb-4">
        {sorted.map((m) => {
          const online = isOnline(m.id);
          return (
            <li key={m.id} className="rounded-md px-2 py-2 hover:bg-surface-2 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  {m.avatar_url ? <AvatarImage src={m.avatar_url} alt={m.display_name} /> : null}
                  <AvatarFallback>{initials(m.display_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold leading-tight">{m.display_name}</p>
                  <p className="truncate font-mono text-[11px] text-fg-muted">@{m.username}</p>
                </div>
                <PresenceBadge online={online} />
              </div>
              {!online ? (
                <p className="mt-1 ml-12 text-[11px] text-fg-muted">
                  Last online {relativeTime(m.last_seen)}
                </p>
              ) : (
                <p className="mt-1 ml-12 text-[11px] font-semibold text-accent-emerald">Online now</p>
              )}
            </li>
          );
        })}
        {members.length === 0 ? (
          <li className="px-2 py-6 text-sm text-fg-muted">No members yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
