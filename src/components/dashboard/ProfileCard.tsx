import { useRef, useState } from 'react';
import { Camera, Loader2, Pencil, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { initials } from '@/lib/utils';

export function ProfileCard() {
  const { user, profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (!user || !profile) return null;

  function startEdit() {
    setDisplayName(profile?.display_name ?? '');
    setBio(profile?.bio ?? '');
    setEditing(true);
  }

  async function save() {
    if (!profile) return;
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('users')
      .update({ display_name: displayName.trim(), bio: bio.trim() || null })
      .eq('id', profile.id);
    setSaving(false);
    if (error) {
      toast.error('Could not save profile', { description: error.message });
      return;
    }
    toast.success('Profile saved');
    setEditing(false);
    await refreshProfile();
  }

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Avatar must be an image');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop() ?? 'png';
    const path = `${profile.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, {
      upsert: true,
      cacheControl: '3600',
    });
    if (upErr) {
      toast.error('Upload failed', { description: upErr.message });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicUrl = data.publicUrl;
    const { error } = await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', profile.id);
    setUploading(false);
    if (error) {
      toast.error('Could not save avatar', { description: error.message });
      return;
    }
    toast.success('Avatar updated');
    await refreshProfile();
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 md:flex-row md:items-start">
        <div className="relative">
          <Avatar className="h-24 w-24">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
            ) : null}
            <AvatarFallback className="text-2xl">{initials(profile.display_name)}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 inline-grid h-8 w-8 place-items-center rounded-full border-2 border-fg bg-accent-blue text-white shadow-brut-sm disabled:opacity-50"
            aria-label="Change avatar"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onPickAvatar}
          />
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex flex-col gap-3">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                className="text-lg font-display font-bold"
              />
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short bio…"
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-3xl font-bold tracking-tight">{profile.display_name}</h1>
                  <p className="font-mono text-sm text-fg-muted">@{profile.username}</p>
                </div>
                <Button size="sm" variant="outline" onClick={startEdit}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </div>
              <p className="mt-3 text-base leading-relaxed text-fg-muted">
                {profile.bio || 'Add a short bio to introduce yourself to teammates.'}
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
