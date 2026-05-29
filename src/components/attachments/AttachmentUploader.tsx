import { useRef, useState } from 'react';
import { Image as ImageIcon, Link as LinkIcon, Loader2, Upload, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { bytesToMB, classifyUrl, VIDEO_MAX_BYTES } from '@/lib/utils';

interface Props {
  projectId: string;
  onCreated?: () => void;
}

type Mode = 'url' | 'image' | 'video';

export function AttachmentUploader({ projectId, onCreated }: Props) {
  const { user } = useAuth();
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
      toast.error('That doesn\'t look like a valid URL');
      return;
    }
    setSubmitting(true);
    const type = classifyUrl(url);
    const { error } = await supabase.from('attachments').insert({
      project_id: projectId,
      type,
      url,
      title: title.trim() || null,
      uploaded_by: user.id,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Could not add link', { description: error.message });
      return;
    }
    setUrl('');
    setTitle('');
    onCreated?.();
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const bucket = mode === 'video' ? 'videos' : 'attachments';
    const isVideo = mode === 'video';

    if (isVideo && file.size > VIDEO_MAX_BYTES) {
      toast.error('Video too large', { description: `Max 50 MB — yours is ${bytesToMB(file.size)} MB` });
      return;
    }
    if (mode === 'image' && !file.type.startsWith('image/')) {
      toast.error('Choose an image file');
      return;
    }
    if (isVideo && !file.type.startsWith('video/')) {
      toast.error('Choose a video file');
      return;
    }

    setSubmitting(true);
    const path = `${projectId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, '_')}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
    });
    if (upErr) {
      toast.error('Upload failed', { description: upErr.message });
      setSubmitting(false);
      return;
    }
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const { error } = await supabase.from('attachments').insert({
      project_id: projectId,
      type: isVideo ? 'video' : 'image',
      url: publicUrl,
      title: file.name,
      uploaded_by: user.id,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Could not save attachment', { description: error.message });
      return;
    }
    if (fileRef.current) fileRef.current.value = '';
    onCreated?.();
  }

  return (
    <div className="rounded-lg border-2 border-fg bg-surface-2 p-4 shadow-brut-sm">
      <div className="flex flex-wrap gap-2">
        <ModeButton active={mode === 'url'} onClick={() => setMode('url')} icon={<LinkIcon className="h-4 w-4" />}>
          Link or repo
        </ModeButton>
        <ModeButton active={mode === 'image'} onClick={() => setMode('image')} icon={<ImageIcon className="h-4 w-4" />}>
          Upload image
        </ModeButton>
        <ModeButton active={mode === 'video'} onClick={() => setMode('video')} icon={<Video className="h-4 w-4" />}>
          Upload video (≤50 MB)
        </ModeButton>
      </div>

      {mode === 'url' ? (
        <form onSubmit={submitUrl} className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="att-url">URL</Label>
            <Input
              id="att-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/your/repo or https://youtu.be/…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="att-title">Title (optional)</Label>
            <Input
              id="att-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is this?"
            />
          </div>
          <Button type="submit" size="sm" className="self-end" disabled={submitting || !url}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Add
          </Button>
        </form>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <Input
            ref={fileRef}
            type="file"
            accept={mode === 'image' ? 'image/*' : 'video/*'}
            onChange={onUpload}
            disabled={submitting}
          />
          {submitting ? (
            <p className="text-xs font-semibold text-fg-muted flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
            </p>
          ) : (
            <p className="text-xs text-fg-muted">
              {mode === 'image' ? 'JPG, PNG, GIF, or WebP.' : 'MP4 or WebM up to 50 MB.'}
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
