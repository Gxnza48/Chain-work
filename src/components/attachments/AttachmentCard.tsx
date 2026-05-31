import { useState } from 'react';
import { ExternalLink, Github, ImageIcon, Trash2, Video as VideoIcon, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useRelativeTimeTick } from '@/hooks/useRelativeTimeTick';
import { relativeTime, safeFaviconUrl, youTubeEmbedUrl } from '@/lib/utils';
import { useT, type TFn } from '@/lib/i18n';
import type { AttachmentRow, UserRow } from '@/types';

interface Props {
  attachment: AttachmentRow;
  uploader: UserRow | undefined;
  onChange?: () => void;
}

export function AttachmentCard({ attachment, uploader, onChange }: Props) {
  const { user } = useAuth();
  const t = useT();
  useRelativeTimeTick();
  const [lightbox, setLightbox] = useState(false);
  const isOwner = user?.id === attachment.uploaded_by;

  async function remove() {
    if (!window.confirm(t('Delete this attachment?'))) return;
    const { error } = await supabase.from('attachments').delete().eq('id', attachment.id);
    if (error) {
      toast.error(t('Could not delete'), { description: error.message });
      return;
    }
    toast.success(t('Attachment removed'));
    onChange?.();
  }

  return (
    <article className="overflow-hidden rounded-lg border-2 border-fg bg-surface shadow-brut-sm">
      <div className="border-b-2 border-fg bg-surface-2">
        {attachment.type === 'image' ? (
          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="block w-full aspect-video bg-surface-2 focus:outline-none"
          >
            <img
              src={attachment.url}
              alt={attachment.title ?? t('Attachment')}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        ) : attachment.type === 'video' ? (
          (() => {
            const embed = youTubeEmbedUrl(attachment.url);
            if (embed) {
              return (
                <iframe
                  src={embed}
                  title={attachment.title ?? t('Video')}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              );
            }
            return (
              <video src={attachment.url} controls className="aspect-video w-full bg-black" preload="metadata" />
            );
          })()
        ) : (
          <LinkPreview attachment={attachment} />
        )}
      </div>
      <div className="flex items-start justify-between gap-3 p-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TypeBadge type={attachment.type} t={t} />
            <a
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className="truncate font-bold text-fg hover:underline"
            >
              {attachment.title ?? attachment.url}
            </a>
          </div>
          <p className="mt-1 truncate font-mono text-[11px] text-fg-muted">
            {uploader ? uploader.display_name : t('Unknown')} · {relativeTime(attachment.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg"
            aria-label={t('Open')}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          {isOwner ? (
            <button
              type="button"
              onClick={remove}
              aria-label={t('Delete attachment')}
              className="rounded-md p-1.5 text-fg-muted hover:bg-accent-rose/10 hover:text-accent-rose"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      {lightbox ? (
        <button
          type="button"
          onClick={() => setLightbox(false)}
          className="fixed inset-0 z-[60] grid place-items-center bg-black/90 p-6"
          aria-label={t('Close image')}
        >
          <img
            src={attachment.url}
            alt={attachment.title ?? t('Attachment')}
            className="max-h-full max-w-full rounded-md border-2 border-white shadow-brut-lg"
          />
        </button>
      ) : null}
    </article>
  );
}

function TypeBadge({ type, t }: { type: AttachmentRow['type']; t: TFn }) {
  if (type === 'repo')
    return (
      <Badge variant="violet">
        <Github className="h-3 w-3" /> {t('Repo')}
      </Badge>
    );
  if (type === 'image')
    return (
      <Badge variant="emerald">
        <ImageIcon className="h-3 w-3" /> {t('Image')}
      </Badge>
    );
  if (type === 'video')
    return (
      <Badge variant="rose">
        <VideoIcon className="h-3 w-3" /> {t('Video')}
      </Badge>
    );
  return (
    <Badge variant="blue">
      <LinkIcon className="h-3 w-3" /> {t('Link')}
    </Badge>
  );
}

function LinkPreview({ attachment }: { attachment: AttachmentRow }) {
  const favicon = safeFaviconUrl(attachment.url);
  let host = attachment.url;
  try {
    host = new URL(attachment.url).hostname;
  } catch {
    /* noop */
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 p-5 hover:bg-surface"
    >
      <span className="grid h-12 w-12 place-items-center rounded-md border-2 border-fg bg-surface text-fg">
        {favicon ? (
          <img src={favicon} alt="" className="h-6 w-6" />
        ) : attachment.type === 'repo' ? (
          <Github className="h-5 w-5" />
        ) : (
          <LinkIcon className="h-5 w-5" />
        )}
      </span>
      <div className="min-w-0">
        <p className="truncate font-bold text-fg">{attachment.title ?? host}</p>
        <p className="truncate text-xs text-fg-muted font-mono">{host}</p>
      </div>
    </a>
  );
}
