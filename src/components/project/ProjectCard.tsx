import { Folder, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { useRelativeTimeTick } from '@/hooks/useRelativeTimeTick';
import { initials, relativeTime } from '@/lib/utils';
import type { ProjectSummary } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  project: ProjectSummary;
  onOpen?: (id: string) => void;
}

export function ProjectCard({ project, onOpen }: Props) {
  useRelativeTimeTick();
  const pct = project.total_todos === 0 ? 0 : Math.round((project.completed_todos / project.total_todos) * 100);
  const visible = project.member_avatars.slice(0, 5);
  const extra = Math.max(0, project.member_avatars.length - visible.length);

  return (
    <button
      type="button"
      onClick={() => onOpen?.(project.id)}
      className="text-left focus:outline-none"
    >
      <Card className="brut-press transition-[transform,box-shadow] hover:shadow-brut-lg">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg border-2 border-fg bg-accent-blue text-white shadow-brut-sm">
              <Folder className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-bold tracking-tight truncate">{project.name}</h3>
              {project.description ? (
                <p className="mt-0.5 line-clamp-2 text-sm text-fg-muted">{project.description}</p>
              ) : (
                <p className="mt-0.5 text-sm italic text-fg-muted">No description</p>
              )}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-mono text-fg-muted">
              <span>{project.completed_todos}/{project.total_todos} completed</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} barClassName={cn(pct === 100 ? 'bg-accent-emerald' : 'bg-accent-blue')} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center -space-x-2">
              {visible.length === 0 ? (
                <span className="text-xs text-fg-muted">
                  <Users className="inline h-3 w-3 mr-1" /> no contributors yet
                </span>
              ) : (
                visible.map((a) => (
                  <Avatar key={a.id} className="h-6 w-6 border-2 border-fg">
                    {a.avatar_url ? <AvatarImage src={a.avatar_url} alt={a.display_name} /> : null}
                    <AvatarFallback className="text-[10px]">{initials(a.display_name)}</AvatarFallback>
                  </Avatar>
                ))
              )}
              {extra > 0 ? (
                <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-fg bg-surface-2 text-[10px] font-bold">
                  +{extra}
                </span>
              ) : null}
            </div>
            <span className="font-mono text-[11px] text-fg-muted">
              created {relativeTime(project.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
