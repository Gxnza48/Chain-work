import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Copy, LogOut, Settings, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Logo } from '@/components/layout/Logo';
import { copyToClipboard } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { ChainRow } from '@/types';

interface Props {
  chain: ChainRow;
  memberCount: number;
  onOpenMembers?: () => void;
}

export function ChainHeader({ chain, memberCount, onOpenMembers }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    const ok = await copyToClipboard(chain.code);
    setCopied(ok);
    if (ok) toast.success('Chain code copied!');
    window.setTimeout(() => setCopied(false), 1500);
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
          <div className="flex items-center gap-2">
            <h1 className="font-display text-lg font-bold tracking-tight truncate">{chain.name}</h1>
            <Badge variant="neutral">
              <Users className="h-3 w-3" /> {memberCount}
            </Badge>
          </div>
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

        <div className="hidden sm:block">
          <Logo size="sm" to="/dashboard" className="hidden" />
        </div>
      </div>
    </header>
  );
}
