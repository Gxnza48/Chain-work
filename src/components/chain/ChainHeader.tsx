import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Copy, Loader2, LogOut, Pencil, Settings, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ContextMenu, type ContextMenuItem } from '@/components/ui/ContextMenu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { cn, copyToClipboard } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/lib/i18n';
import type { ChainRow } from '@/types';

interface Props {
  chain: ChainRow;
  memberCount: number;
  canEdit?: boolean;
  onRenamed?: () => void;
  onOpenMembers?: () => void;
}

export function ChainHeader({ chain, memberCount, canEdit, onRenamed, onOpenMembers }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(chain.name);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(chain.name);
  }, [chain.name]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function copyCode() {
    const ok = await copyToClipboard(chain.code);
    setCopied(ok);
    if (ok) toast.success(t('Chain code copied!'));
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(t('Chain name cannot be empty'));
      return;
    }
    if (trimmed === chain.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('chains').update({ name: trimmed }).eq('id', chain.id);
    setSaving(false);
    if (error) {
      toast.error(t('Could not rename chain'), { description: error.message });
      return;
    }
    toast.success(t('Chain renamed'));
    setEditing(false);
    onRenamed?.();
  }

  function startEdit() {
    setName(chain.name);
    setEditing(true);
  }

  async function leaveChain() {
    if (!user) return;
    if (!window.confirm(t('Leave this chain? You can rejoin with the code.'))) return;
    const { error } = await supabase
      .from('chain_members')
      .delete()
      .eq('chain_id', chain.id)
      .eq('user_id', user.id);
    if (error) {
      toast.error(t('Could not leave'), { description: error.message });
      return;
    }
    toast.success(t('Left chain'));
    navigate('/dashboard', { replace: true });
  }

  const nameMenuItems: ContextMenuItem[] = canEdit
    ? [{ label: t('Rename chain'), icon: <Pencil className="h-4 w-4" />, onSelect: startEdit }]
    : [];

  return (
    <header className="sticky top-0 z-20 border-b-2 border-fg bg-bg/90 backdrop-blur-md">
      <div className="flex h-14 items-center gap-1.5 px-3 sm:gap-3 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/dashboard" aria-label={t('Back to dashboard')}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t('Dashboard')}</span>
          </Link>
        </Button>

        <div className="hidden h-6 w-px bg-fg/20 sm:block" />

        <div className="min-w-0 flex-1">
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveName();
              }}
              className="flex min-w-0 items-center gap-2"
            >
              <Input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setName(chain.name);
                    setEditing(false);
                  }
                }}
                className="h-9 w-full min-w-0 max-w-xs font-display text-lg font-bold"
                aria-label={t('Chain name')}
              />
              <button
                type="submit"
                disabled={saving}
                aria-label={t('Save name')}
                className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 border-fg bg-accent-emerald text-white shadow-brut-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setName(chain.name);
                  setEditing(false);
                }}
                aria-label={t('Cancel rename')}
                className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 border-fg bg-surface text-fg shadow-brut-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <ContextMenu items={nameMenuItems} disabled={!canEdit}>
              <div className="flex items-center gap-2">
                <h1
                  onDoubleClick={canEdit ? startEdit : undefined}
                  className={cn(
                    'font-display text-lg font-bold tracking-tight truncate',
                    canEdit ? 'cursor-text' : '',
                  )}
                  title={canEdit ? t('Double-click or right-click to rename') : undefined}
                >
                  {chain.name}
                </h1>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={startEdit}
                    aria-label={t('Rename chain')}
                    className="hidden rounded-md p-1 text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg sm:inline-grid"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <Badge variant="neutral">
                  <Users className="h-3 w-3" /> {memberCount}
                </Badge>
              </div>
            </ContextMenu>
          )}
        </div>

        <button
          type="button"
          onClick={copyCode}
          className="hidden shrink-0 items-center gap-2 rounded-md border-2 border-fg bg-surface-2 px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-fg shadow-brut-sm hover:bg-surface md:inline-flex"
        >
          {copied ? <Check className="h-4 w-4 text-accent-emerald" /> : <Copy className="h-4 w-4" />}
          {chain.code}
        </button>

        {/* Group the secondary controls so they can be hidden together while renaming on mobile. */}
        <div className={cn('flex items-center gap-1.5 sm:gap-2', editing && 'hidden sm:flex')}>
          <button
            type="button"
            onClick={onOpenMembers}
            className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 border-fg bg-surface text-fg shadow-brut-sm lg:hidden"
            aria-label={t('Open members')}
          >
            <Users className="h-5 w-5" />
          </button>

          <LanguageToggle className="shrink-0" />

          <ThemeToggle className="shrink-0" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t('Chain settings')}
              className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2 border-fg bg-surface text-fg shadow-brut-sm"
            >
              <Settings className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit ? (
              <DropdownMenuItem onSelect={startEdit}>
                <Pencil className="h-4 w-4" />
                {t('Rename chain')}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onSelect={copyCode}>
              <Copy className="h-4 w-4" />
              {t('Copy chain code')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={leaveChain} className="text-accent-rose">
              <LogOut className="h-4 w-4" />
              {t('Leave chain')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
