import { Link } from 'react-router-dom';
import { ArrowUpRight, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { relativeTime } from '@/lib/utils';
import { useRelativeTimeTick } from '@/hooks/useRelativeTimeTick';
import { useT } from '@/lib/i18n';
import type { ChainSummary } from '@/types';

interface Props {
  chain: ChainSummary;
}

export function ChainCard({ chain }: Props) {
  useRelativeTimeTick();
  const t = useT();
  return (
    <Link to={`/chain/${chain.id}`} className="block group focus:outline-none">
      <Card className="brut-press transition-[transform,box-shadow] hover:shadow-brut-lg">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-xl font-bold tracking-tight truncate">{chain.name}</h3>
              <p className="mt-1 font-mono text-xs text-fg-muted">{chain.code}</p>
            </div>
            <ArrowUpRight className="h-5 w-5 text-fg-muted transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
          </div>
          <div className="flex items-center justify-between text-xs">
            <Badge variant="neutral">
              <Users className="h-3 w-3" /> {chain.member_count}{' '}
              {chain.member_count === 1 ? t('member') : t('members')}
            </Badge>
            <span className="font-mono text-xs text-fg-muted">
              {chain.last_activity
                ? t('active {time}', { time: relativeTime(chain.last_activity) })
                : t('no activity yet')}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
