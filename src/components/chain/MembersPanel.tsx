import { useState } from 'react';
import { Ban, Crown, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ContextMenu, type ContextMenuItem } from '@/components/ui/ContextMenu';
import { PresenceBadge } from './PresenceBadge';
import { MemberProfileDialog } from './MemberProfileDialog';
import { usePresence } from '@/hooks/usePresence';
import { useRelativeTimeTick } from '@/hooks/useRelativeTimeTick';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';
import { initials, relativeTime } from '@/lib/utils';
import type { ChainMemberProfile, ChainRole } from '@/types';

interface Props {
  chainId: string;
  members: ChainMemberProfile[];
  myRole?: ChainRole | null;
  onChanged?: () => void;
}

export function MembersPanel({ chainId, members, myRole, onChanged }: Props) {
  const { isOnline, lastSeenAt } = usePresence(chainId);
  useRelativeTimeTick();
  const myId = useAuthStore((s) => s.user?.id ?? null);
  const isOwner = myRole === 'owner';
  const [viewing, setViewing] = useState<ChainMemberProfile | null>(null);

  const sorted = [...members].sort((a, b) => {
    const ao = isOnline(a.id);
    const bo = isOnline(b.id);
    if (ao !== bo) return ao ? -1 : 1;
    return a.display_name.localeCompare(b.display_name);
  });

  async function promote(member: ChainMemberProfile) {
    const { error } = await supabase
      .from('chain_members')
      .update({ role: 'owner' })
      .eq('chain_id', chainId)
      .eq('user_id', member.id);
    if (error) {
      toast.error('Could not promote', { description: error.message });
      return;
    }
    toast.success(`${member.display_name} is now an owner`);
    onChanged?.();
  }

  async function ban(member: ChainMemberProfile) {
    if (!window.confirm(`Remove ${member.display_name} from this chain?`)) return;
    const { error } = await supabase
      .from('chain_members')
      .delete()
      .eq('chain_id', chainId)
      .eq('user_id', member.id);
    if (error) {
      toast.error('Could not remove member', { description: error.message });
      return;
    }
    toast.success(`${member.display_name} was removed`);
    onChanged?.();
  }

  function itemsFor(member: ChainMemberProfile): ContextMenuItem[] {
    // Only owners get actions, and never on themselves or other owners.
    if (!isOwner || member.id === myId || member.role === 'owner') return [];
    return [
      {
        label: 'Promote to owner',
        icon: <Crown className="h-4 w-4" />,
        onSelect: () => promote(member),
      },
      {
        label: 'Ban from chain',
        icon: <Ban className="h-4 w-4" />,
        onSelect: () => ban(member),
        danger: true,
      },
    ];
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-fg-muted">Members</h2>
        <p className="mt-0.5 text-xs text-fg-muted">
          {members.length} total
          {isOwner ? ' · right-click to manage' : ''}
        </p>
      </div>
      <ul className="mt-3 flex-1 overflow-y-auto px-2 pb-4">
        {sorted.map((m) => {
          const online = isOnline(m.id);
          const items = itemsFor(m);
          return (
            <ContextMenu key={m.id} items={items} disabled={items.length === 0}>
              <li
                role="button"
                tabIndex={0}
                onClick={() => setViewing(m)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setViewing(m);
                  }
                }}
                title="View profile"
                className="cursor-pointer rounded-md px-2 py-2 outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent-blue"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {m.avatar_url ? <AvatarImage src={m.avatar_url} alt={m.display_name} /> : null}
                    <AvatarFallback>{initials(m.display_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold leading-tight">
                      <span className="truncate">{m.display_name}</span>
                      {m.role === 'owner' ? (
                        <Badge variant="amber" className="shrink-0 px-1.5 py-0">
                          <Crown className="h-3 w-3" /> Owner
                        </Badge>
                      ) : null}
                    </p>
                    <p className="truncate font-mono text-[11px] text-fg-muted">@{m.username}</p>
                  </div>
                  <PresenceBadge online={online} />
                </div>
                {!online ? (
                  <p className="mt-1 ml-12 text-[11px] text-fg-muted">
                    Last online {relativeTime(lastSeenAt(m.id) ?? m.last_seen)}
                  </p>
                ) : (
                  <p className="mt-1 ml-12 text-[11px] font-semibold text-accent-emerald">Online now</p>
                )}
              </li>
            </ContextMenu>
          );
        })}
        {members.length === 0 ? (
          <li className="px-2 py-6 text-sm text-fg-muted">No members yet.</li>
        ) : null}
      </ul>
      {isOwner ? (
        <div className="border-t-2 border-fg/20 px-4 py-2 text-[11px] text-fg-muted">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> You manage this chain
          </span>
        </div>
      ) : null}

      <MemberProfileDialog
        member={viewing}
        online={viewing ? isOnline(viewing.id) : false}
        lastSeen={viewing ? lastSeenAt(viewing.id) ?? viewing.last_seen : null}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      />
    </div>
  );
}
