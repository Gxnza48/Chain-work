import { Crown, Link2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { PresenceBadge } from './PresenceBadge';
import { initials, relativeTime } from '@/lib/utils';
import type { ChainMemberProfile } from '@/types';

interface Props {
  member: ChainMemberProfile | null;
  online: boolean;
  lastSeen: string | null;
  onOpenChange: (open: boolean) => void;
}

function prettyLink(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

export function MemberProfileDialog({ member, online, lastSeen, onOpenChange }: Props) {
  return (
    <Dialog open={Boolean(member)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        {member ? (
          <div className="flex flex-col items-center gap-4 pt-2 text-center">
            <Avatar className="h-24 w-24 border-2 border-fg shadow-brut">
              {member.avatar_url ? (
                <AvatarImage src={member.avatar_url} alt={member.display_name} />
              ) : null}
              <AvatarFallback className="text-2xl">{initials(member.display_name)}</AvatarFallback>
            </Avatar>

            <div>
              <DialogTitle className="flex items-center justify-center gap-2">
                {member.display_name}
                {member.role === 'owner' ? (
                  <Badge variant="amber" className="px-1.5 py-0">
                    <Crown className="h-3 w-3" /> Owner
                  </Badge>
                ) : null}
              </DialogTitle>
              <p className="mt-0.5 font-mono text-sm text-fg-muted">@{member.username}</p>
            </div>

            <div className="flex items-center gap-2 rounded-md border-2 border-fg bg-surface-2 px-3 py-1.5">
              <PresenceBadge online={online} />
              <span className="text-xs font-semibold text-fg-muted">
                {online ? 'Online now' : `Last online ${relativeTime(lastSeen)}`}
              </span>
            </div>

            {member.bio ? (
              <p className="text-sm leading-relaxed text-fg-muted">{member.bio}</p>
            ) : (
              <p className="text-sm italic text-fg-muted">No bio yet.</p>
            )}

            {member.website ? (
              <a
                href={member.website}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex max-w-full items-center gap-1.5 rounded-md border-2 border-fg bg-surface-2 px-3 py-1.5 text-sm font-semibold text-fg shadow-brut-sm transition-colors hover:bg-surface"
              >
                <Link2 className="h-4 w-4 shrink-0 text-accent-blue" />
                <span className="truncate">{prettyLink(member.website)}</span>
              </a>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
