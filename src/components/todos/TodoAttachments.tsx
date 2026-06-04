import { useRef, useState } from 'react';
import { Download, File as FileIcon, Loader2, Paperclip, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { useTodoAttachments } from '@/hooks/useTodoAttachments';
import { useT } from '@/lib/i18n';
import type { TodoAttachmentRow } from '@/types';

interface Props {
  todoId: string;
  chainId: string;
  /** Hide the remove buttons (e.g. completed todos shown read-only). */
  readOnly?: boolean;
}

export function TodoAttachments({ todoId, chainId, readOnly }: Props) {
  const t = useT();
  const { items, loading, add, remove } = useTodoAttachments(todoId, chainId);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<TodoAttachmentRow | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await add(file);
      }
    } catch (err) {
      toast.error(t('Could not upload file'), { description: (err as Error).message });
    } finally {
      setUploading(false);
    }
  }

  async function onRemove(att: TodoAttachmentRow) {
    if (!window.confirm(t('Remove this attachment?'))) return;
    try {
      await remove(att);
    } catch (err) {
      toast.error(t('Could not remove attachment'), { description: (err as Error).message });
    }
  }

  const isImage = (att: TodoAttachmentRow) => att.type?.startsWith('image/');

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          void onFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={uploading || readOnly}
        onClick={() => inputRef.current?.click()}
        className="self-start"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        {t('Attach file or screenshot')}
      </Button>

      {loading ? (
        <p className="text-xs text-fg-muted">{t('Loading…')}</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-fg-muted">{t('No attachments yet.')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map((att) =>
            isImage(att) ? (
              <div key={att.id} className="group relative">
                <button
                  type="button"
                  onClick={() => setLightbox(att)}
                  className="block aspect-video w-full cursor-zoom-in overflow-hidden rounded-md border-2 border-fg"
                >
                  <img src={att.url} alt={att.name} className="h-full w-full object-cover" />
                </button>
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => onRemove(att)}
                    aria-label={t('Remove this attachment?')}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md border-2 border-fg bg-surface text-fg-muted opacity-100 shadow-brut-sm hover:text-accent-rose sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            ) : (
              <div
                key={att.id}
                className="flex items-center gap-2 rounded-md border-2 border-fg bg-surface-2 px-2 py-1.5"
              >
                <FileIcon className="h-5 w-5 shrink-0 text-accent-violet" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{att.name}</span>
                  {att.size ? (
                    <span className="block text-[10px] text-fg-muted">{Math.round(att.size / 1024)} KB</span>
                  ) : null}
                </span>
                <a
                  href={att.url}
                  download={att.name}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t('Download')}
                  className="shrink-0 rounded-md p-1 text-fg-muted hover:text-fg"
                >
                  <Download className="h-4 w-4" />
                </a>
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => onRemove(att)}
                    aria-label={t('Remove this attachment?')}
                    className="shrink-0 rounded-md p-1 text-fg-muted hover:text-accent-rose"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ),
          )}
        </div>
      )}

      <Dialog open={Boolean(lightbox)} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="sr-only">{lightbox?.name || t('Image')}</DialogTitle>
          </DialogHeader>
          {lightbox ? (
            <div className="flex flex-col gap-3">
              <img
                src={lightbox.url}
                alt={lightbox.name}
                className="mx-auto max-h-[70vh] w-auto max-w-full rounded-md border-2 border-fg object-contain"
              />
              <a
                href={lightbox.url}
                download={lightbox.name}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 self-center rounded-md border-2 border-fg bg-surface-2 px-3 py-1.5 text-sm font-semibold shadow-brut-sm hover:bg-surface"
              >
                <Download className="h-4 w-4" />
                {t('Download')}
              </a>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
