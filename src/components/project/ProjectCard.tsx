import { useEffect, useRef, useState } from 'react';
import { Check, Folder, Loader2, Pencil, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Input } from '@/components/ui/Input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { ContextMenu, type ContextMenuItem } from '@/components/ui/ContextMenu';
import { useRelativeTimeTick } from '@/hooks/useRelativeTimeTick';
import { supabase } from '@/lib/supabase';
import { initials, relativeTime } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import type { ProjectSummary } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  project: ProjectSummary;
  canManage?: boolean;
  onOpen?: (id: string) => void;
  onRenamed?: () => void;
}

export function ProjectCard({ project, canManage, onOpen, onRenamed }: Props) {
  useRelativeTimeTick();
  const t = useT();
  const pct = project.total_todos === 0 ? 0 : Math.round((project.completed_todos / project.total_todos) * 100);
  const visible = project.member_avatars.slice(0, 5);
  const extra = Math.max(0, project.member_avatars.length - visible.length);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setName(project.name), [project.name]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(t('Project name cannot be empty'));
      return;
    }
    if (trimmed === project.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('projects').update({ name: trimmed }).eq('id', project.id);
    setSaving(false);
    if (error) {
      toast.error(t('Could not rename project'), { description: error.message });
      return;
    }
    toast.success(t('Project renamed'));
    setEditing(false);
    onRenamed?.();
  }

  const menuItems: ContextMenuItem[] = canManage
    ? [
        {
          label: t('Rename project'),
          icon: <Pencil className="h-4 w-4" />,
          onSelect: () => {
            setName(project.name);
            setEditing(true);
          },
        },
      ]
    : [];

  return (
    <ContextMenu items={menuItems} disabled={!canManage}>
      <div
        role="button"
        tabIndex={editing ? -1 : 0}
        onClick={() => {
          if (!editing) onOpen?.(project.id);
        }}
        onKeyDown={(e) => {
          if (!editing && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onOpen?.(project.id);
          }
        }}
        className="block w-full text-left focus:outline-none"
      >
        <Card className={cn('transition-[transform,box-shadow]', editing ? '' : 'brut-press hover:shadow-brut-lg')}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 border-fg bg-accent-blue text-white shadow-brut-sm">
                <Folder className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                {editing ? (
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setName(project.name);
                        setEditing(false);
                      }
                    }}
                  >
                    <Input
                      ref={inputRef}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          saveName();
                        }
                      }}
                      className="h-9 font-display text-base font-bold"
                      aria-label={t('Project name')}
                    />
                    <button
                      type="button"
                      onClick={saveName}
                      disabled={saving}
                      aria-label={t('Save name')}
                      className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 border-fg bg-accent-emerald text-white shadow-brut-sm disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setName(project.name);
                        setEditing(false);
                      }}
                      aria-label={t('Cancel rename')}
                      className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 border-fg bg-surface text-fg shadow-brut-sm"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-display text-lg font-bold tracking-tight truncate">{project.name}</h3>
                    {project.description ? (
                      <p className="mt-0.5 line-clamp-2 text-sm text-fg-muted">{project.description}</p>
                    ) : (
                      <p className="mt-0.5 text-sm italic text-fg-muted">{t('No description')}</p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-mono text-fg-muted">
                <span>
                  {t('{completed}/{total} completed', {
                    completed: project.completed_todos,
                    total: project.total_todos,
                  })}
                </span>
                <span>{pct}%</span>
              </div>
              <Progress value={pct} barClassName={cn(pct === 100 ? 'bg-accent-emerald' : 'bg-accent-blue')} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center -space-x-2">
                {visible.length === 0 ? (
                  <span className="text-xs text-fg-muted">
                    <Users className="inline h-3 w-3 mr-1" /> {t('no contributors yet')}
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
                {t('created {time}', { time: relativeTime(project.created_at) })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </ContextMenu>
  );
}
