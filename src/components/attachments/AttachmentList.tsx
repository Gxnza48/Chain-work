import { useCallback, useEffect, useState } from 'react';
import { Paperclip, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AttachmentCard } from './AttachmentCard';
import { AttachmentUploader } from './AttachmentUploader';
import { useT } from '@/lib/i18n';
import type { AttachmentRow, UserRow } from '@/types';

interface Props {
  projectId: string;
  members: UserRow[];
}

export function AttachmentList({ projectId, members }: Props) {
  const t = useT();
  const [items, setItems] = useState<AttachmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('attachments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    setItems((data ?? []) as AttachmentRow[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`attachments:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attachments', filter: `project_id=eq.${projectId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch).catch(() => {});
    };
  }, [projectId, load]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border-2 border-fg bg-accent-rose text-white shadow-brut-sm">
            <Paperclip className="h-4 w-4" />
          </span>
          <h3 className="truncate font-display text-lg font-bold tracking-tight">{t('Links & Media')}</h3>
          <Badge variant="neutral" className="shrink-0">{items.length}</Badge>
        </div>
        {!adding ? (
          <Button size="sm" onClick={() => setAdding(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" /> {t('Add attachment')}
          </Button>
        ) : null}
      </div>

      {adding ? (
        <AttachmentUploader
          projectId={projectId}
          onCreated={() => {
            setAdding(false);
            load();
          }}
        />
      ) : null}

      {loading ? (
        <p className="text-sm text-fg-muted">{t('Loading…')}</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-fg bg-surface-2 p-8 text-center">
          <p className="font-semibold">{t('Nothing attached yet.')}</p>
          <p className="mt-1 text-sm text-fg-muted">{t("Drop a repo link, an image, a YouTube URL — whatever's useful.")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((a) => (
            <AttachmentCard
              key={a.id}
              attachment={a}
              uploader={memberMap.get(a.uploaded_by)}
              onChange={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
