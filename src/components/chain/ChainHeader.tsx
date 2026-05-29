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
import { cn, copyToClipboard } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
    if (ok) toast.success('Chain code copied!');
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Chain name cannot be empty');
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
      toast.error('Could not rename chain', { description: error.message });
      return;
    }
    toast.success('Chain renamed');
    setEditing(false);
    onRenamed?.();
  }

  function startEdit() {
    setName(chain.name);
    setEditing(true);
  }

  async function leaveChain() {
    if (!user) return;
    if (!window.confirm('Leave this chain? You can rejoin with the code.')) return;
    const { error } = await supabase
      .from('chain_members')
      .delete()
      .eq('chain_id', chain.id)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Could not leave', { description: error.message });
      return;
    }
    toast.success('Left chain');
    navigate('/dashboard', { replace: true });
  }

  const nameMenuItems: ContextMenuItem[] = canEdit
    ? [{ label: 'Rename chain', icon: <Pencil className="h-4 w-4" />, onSelect: startEdit }]
    : [];

  return (
    <header className="sticky top-0 z-20 border-b-2 border-fg bg-bg/90 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/dashboard" aria-label="Back to dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
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
              className="flex items-center gap-2"
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
                className="h-9 max-w-xs font-display text-lg font-bold"
                aria-label="Chain name"
              />
              <button
                type="submit"
                disabled={saving}
                aria-label="Save name"
                className="inline-grid h-9 w-9 place-items-center rounded-md border-2 border-fg bg-accent-emerald text-white shadow-brut-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setName(chain.name);
                  setEditing(false);
                }}
                aria-label="Cancel rename"
                className="inline-grid h-9 w-9 place-items-center rounded-md border-2 border-fg bg-surface text-fg shadow-brut-sm"
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
                  title={canEdit ? 'Double-click or right-click to rename' : undefined}
                >
                  {chain.name}
                </h1>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={startEdit}
                    aria-label="Rename chain"
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
          className="hidden items-center gap-2 rounded-md border-2 border-fg bg-surface-2 px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-fg shadow-brut-sm hover:bg-surface md:inline-flex"
        >
          {copied ? <Check className="h-4 w-4 text-accent-emerald" /> : <Copy className="h-4 w-4" />}
          {chain.code}
        </button>

        <button
          type="button"
          onClick={onOpenMembers}
          className="inline-grid h-10 w-10 place-items-center rounded-lg border-2 border-fg bg-surface text-fg shadow-brut-sm lg:hidden"
          aria-label="Open members"
        >
          <Users className="h-5 w-5" />
        </button>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Chain settings"
              className="inline-grid h-10 w-10 place-items-center rounded-lg border-2 border-fg bg-surface text-fg shadow-brut-sm"
            >
              <Settings className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit ? (
              <DropdownMenuItem onSelect={startEdit}>
                <Pencil className="h-4 w-4" />
                Rename chain
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onSelect={copyCode}>
              <Copy className="h-4 w-4" />
              Copy chain code
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={leaveChain} className="text-accent-rose">
              <LogOut className="h-4 w-4" />
              Leave chain
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
