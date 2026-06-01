import { useEffect, useState } from 'react';
import {
  ExternalLink,
  FileCode,
  FileText,
  Github,
  ImageIcon,
  Maximize2,
  Trash2,
  Video as VideoIcon,
  Link as LinkIcon,
  X,
} from 'lucide-react';
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
  const [pdfOpen, setPdfOpen] = useState(false);
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
        ) : attachment.type === 'pdf' ? (
          <button
            type="button"
            onClick={() => setPdfOpen(true)}
            className="group relative block w-full aspect-video overflow-hidden bg-surface-2 focus:outline-none"
            aria-label={t('View PDF')}
          >
            <iframe
              src={`${attachment.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              title={attachment.title ?? t('PDF')}
              className="pointer-events-none h-full w-full bg-white"
              loading="lazy"
            />
            <span className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover:bg-black/40">
              <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-fg bg-white px-3 py-1.5 text-xs font-bold text-fg opacity-0 shadow-brut-sm transition-opacity group-hover:opacity-100">
                <Maximize2 className="h-3.5 w-3.5" /> {t('View PDF')}
              </span>
            </span>
          </button>
        ) : attachment.type === 'html' ? (
          <HtmlPreview attachment={attachment} />
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
      {pdfOpen ? (
        <div className="fixed inset-0 z-[60] flex flex-col gap-3 bg-black/90 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate font-bold text-white">{attachment.title ?? t('PDF')}</p>
            <div className="flex items-center gap-2">
              <a
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border-2 border-white bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
              >
                <ExternalLink className="h-4 w-4" /> {t('Open')}
              </a>
              <button
                type="button"
                onClick={() => setPdfOpen(false)}
                aria-label={t('Close')}
                className="inline-flex items-center gap-1.5 rounded-md border-2 border-white bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" /> {t('Close')}
              </button>
            </div>
          </div>
          <iframe
            src={attachment.url}
            title={attachment.title ?? t('PDF')}
            className="min-h-0 flex-1 w-full rounded-md border-2 border-white bg-white shadow-brut-lg"
          />
        </div>
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
  if (type === 'pdf')
    return (
      <Badge variant="amber">
        <FileText className="h-3 w-3" /> {t('PDF')}
      </Badge>
    );
  if (type === 'html')
    return (
      <Badge variant="emerald">
        <FileCode className="h-3 w-3" /> {t('HTML')}
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

/** Inject a <base href> so relative resources inside the uploaded HTML resolve
 *  against the file's folder in storage, and render in an iframe regardless of
 *  the content-type the server sends back. */
function withBaseHref(html: string, url: string): string {
  if (/<base\s/i.test(html)) return html;
  const dir = url.slice(0, url.lastIndexOf('/') + 1);
  const baseTag = `<base href="${dir}">`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
  return baseTag + html;
}

function HtmlPreview({ attachment }: { attachment: AttachmentRow }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const sandbox = 'allow-scripts allow-popups allow-forms';

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setFailed(false);
    fetch(attachment.url)
      .then((r) => r.text())
      .then((text) => {
        if (!cancelled) setHtml(withBaseHref(text, attachment.url));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attachment.url]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full aspect-video overflow-hidden bg-white focus:outline-none"
        aria-label={t('View HTML')}
      >
        {html != null ? (
          <iframe
            srcDoc={html}
            title={attachment.title ?? t('HTML')}
            sandbox={sandbox}
            className="pointer-events-none h-full w-full bg-white"
            loading="lazy"
          />
        ) : failed ? (
          <span className="flex h-full w-full items-center gap-3 p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md border-2 border-fg bg-accent-emerald text-white">
              <FileCode className="h-5 w-5" />
            </span>
            <span className="min-w-0 text-left">
              <span className="block truncate font-bold text-fg">{attachment.title ?? t('HTML')}</span>
              <span className="block truncate text-xs text-fg-muted font-mono">{t('Open')}</span>
            </span>
          </span>
        ) : (
          <span className="grid h-full w-full place-items-center text-xs font-semibold text-fg-muted">
            {t('Loading…')}
          </span>
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover:bg-black/40">
          <span className="inline-flex items-center gap-1.5 rounded-md border-2 border-fg bg-white px-3 py-1.5 text-xs font-bold text-fg opacity-0 shadow-brut-sm transition-opacity group-hover:opacity-100">
            <Maximize2 className="h-3.5 w-3.5" /> {t('View HTML')}
          </span>
        </span>
      </button>
      {open ? (
        <div className="fixed inset-0 z-[60] flex flex-col gap-3 bg-black/90 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate font-bold text-white">{attachment.title ?? t('HTML')}</p>
            <div className="flex items-center gap-2">
              <a
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border-2 border-white bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
              >
                <ExternalLink className="h-4 w-4" /> {t('Open')}
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('Close')}
                className="inline-flex items-center gap-1.5 rounded-md border-2 border-white bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" /> {t('Close')}
              </button>
            </div>
          </div>
          {html != null ? (
            <iframe
              srcDoc={html}
              title={attachment.title ?? t('HTML')}
              sandbox={sandbox}
              className="min-h-0 flex-1 w-full rounded-md border-2 border-white bg-white shadow-brut-lg"
            />
          ) : (
            <div className="grid min-h-0 flex-1 place-items-center rounded-md border-2 border-white bg-white">
              <p className="text-sm font-semibold text-fg-muted">{t('Loading…')}</p>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
