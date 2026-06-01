import { useRef, useState } from 'react';
import { FileText, Image as ImageIcon, Link as LinkIcon, Loader2, Upload, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { supabase } from '@/lib/supabase';
import { notifyEvent } from '@/lib/push';
import { useAuth } from '@/hooks/useAuth';
import { bytesToMB, classifyDocFile, classifyUrl, DOC_MAX_BYTES, VIDEO_MAX_BYTES } from '@/lib/utils';
import { useT } from '@/lib/i18n';

interface Props {
  projectId: string;
  onCreated?: () => void;
}

type Mode = 'url' | 'image' | 'video' | 'doc';

export function AttachmentUploader({ projectId, onCreated }: Props) {
  const { user } = useAuth();
  const t = useT();
  const [mode, setMode] = useState<Mode>('url');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function submitUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      new URL(url);
    } catch {
      toast.error(t("That doesn't look like a valid URL"));
      return;
    }
    setSubmitting(true);
    const type = classifyUrl(url);
    const { data, error } = await supabase
      .from('attachments')
      .insert({
        project_id: projectId,
        type,
        url,
        title: title.trim() || null,
        uploaded_by: user.id,
      })
      .select('id')
      .single();
    setSubmitting(false);
    if (error) {
      toast.error(t('Could not add link'), { description: error.message });
      return;
    }
    if (data) void notifyEvent('file', { id: data.id });
    setUrl('');
    setTitle('');
    onCreated?.();
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const bucket = mode === 'video' ? 'videos' : 'attachments';
    const isVideo = mode === 'video';
    const isDoc = mode === 'doc';

    if (isVideo && file.size > VIDEO_MAX_BYTES) {
      toast.error(t('Video too large'), {
        description: t('Max 50 MB — yours is {mb} MB', { mb: bytesToMB(file.size) }),
      });
      return;
    }
    if (mode === 'image' && !file.type.startsWith('image/')) {
      toast.error(t('Choose an image file'));
      return;
    }
    if (isVideo && !file.type.startsWith('video/')) {
      toast.error(t('Choose a video file'));
      return;
    }
    let docType: 'pdf' | 'html' | null = null;
    if (isDoc) {
      docType = classifyDocFile(file);
      if (!docType) {
        toast.error(t('Choose a PDF or HTML file'));
        return;
      }
      if (file.size > DOC_MAX_BYTES) {
        toast.error(t('File too large'), {
          description: t('Max 25 MB — yours is {mb} MB', { mb: bytesToMB(file.size) }),
        });
        return;
      }
    }

    setSubmitting(true);
    const path = `${projectId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, '_')}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      contentType: file.type || (docType === 'pdf' ? 'application/pdf' : 'text/html'),
    });
    if (upErr) {
      toast.error(t('Upload failed'), { description: upErr.message });
      setSubmitting(false);
      return;
    }
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const { data, error } = await supabase
      .from('attachments')
      .insert({
        project_id: projectId,
        type: isVideo ? 'video' : isDoc ? (docType as 'pdf' | 'html') : 'image',
        url: publicUrl,
        title: file.name,
        uploaded_by: user.id,
      })
      .select('id')
      .single();
    setSubmitting(false);
    if (error) {
      toast.error(t('Could not save attachment'), { description: error.message });
      return;
    }
    if (data) void notifyEvent('file', { id: data.id });
    if (fileRef.current) fileRef.current.value = '';
    onCreated?.();
  }

  return (
    <div className="rounded-lg border-2 border-fg bg-surface-2 p-4 shadow-brut-sm">
      <div className="flex flex-wrap gap-2">
        <ModeButton active={mode === 'url'} onClick={() => setMode('url')} icon={<LinkIcon className="h-4 w-4" />}>
          {t('Link or repo')}
        </ModeButton>
        <ModeButton active={mode === 'image'} onClick={() => setMode('image')} icon={<ImageIcon className="h-4 w-4" />}>
          {t('Upload image')}
        </ModeButton>
        <ModeButton active={mode === 'video'} onClick={() => setMode('video')} icon={<Video className="h-4 w-4" />}>
          {t('Upload video (≤50 MB)')}
        </ModeButton>
        <ModeButton active={mode === 'doc'} onClick={() => setMode('doc')} icon={<FileText className="h-4 w-4" />}>
          {t('Upload PDF / HTML')}
        </ModeButton>
      </div>

      {mode === 'url' ? (
        <form onSubmit={submitUrl} className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="att-url">{t('URL')}</Label>
            <Input
              id="att-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/your/repo or https://youtu.be/…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="att-title">{t('Title (optional)')}</Label>
            <Input
              id="att-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('What is this?')}
            />
          </div>
          <Button type="submit" size="sm" className="self-end" disabled={submitting || !url}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {t('Add')}
          </Button>
        </form>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <Input
            ref={fileRef}
            type="file"
            accept={mode === 'image' ? 'image/*' : mode === 'video' ? 'video/*' : '.pdf,.html,.htm,application/pdf,text/html'}
            onChange={onUpload}
            disabled={submitting}
          />
          {submitting ? (
            <p className="text-xs font-semibold text-fg-muted flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin-slow" /> {t('Uploading…')}
            </p>
          ) : (
            <p className="text-xs text-fg-muted">
              {mode === 'image'
                ? t('JPG, PNG, GIF, or WebP.')
                : mode === 'video'
                  ? t('MP4 or WebM up to 50 MB.')
                  : t('PDF (preview inline) or .html (opens in a new tab) up to 25 MB.')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface ModeButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function ModeButton({ active, onClick, icon, children }: ModeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'inline-flex items-center gap-1.5 rounded-md border-2 border-fg bg-accent-blue text-white px-3 py-1.5 text-xs font-bold shadow-brut-sm'
          : 'inline-flex items-center gap-1.5 rounded-md border-2 border-fg bg-surface text-fg px-3 py-1.5 text-xs font-bold hover:bg-surface-2'
      }
    >
      {icon}
      {children}
    </button>
  );
}
