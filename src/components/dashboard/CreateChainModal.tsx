import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { supabase } from '@/lib/supabase';
import { copyToClipboard } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/lib/i18n';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

interface Created {
  id: string;
  name: string;
  code: string;
}

export function CreateChainModal({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const t = useT();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setName('');
    setCreated(null);
    setSubmitting(false);
    setCopied(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(t('Give your chain a name'));
      return;
    }
    setSubmitting(true);

    const { data, error } = await supabase.rpc('create_chain', { p_name: trimmed });

    if (error || !data || data.length === 0) {
      const msg = error?.message ?? 'Unknown error';
      if (/NOT_AUTHENTICATED/.test(msg)) {
        toast.error(t('Session expired'), { description: t('Please sign in again.') });
      } else if (/CODE_COLLISION/.test(msg)) {
        toast.error(t('Could not generate a unique chain code. Please try again.'));
      } else {
        toast.error(t('Could not create chain'), { description: msg });
      }
      setSubmitting(false);
      return;
    }

    const row = data[0]!;
    const chain: Created = { id: row.chain_id, name: row.chain_name, code: row.chain_code };

    const ok = await copyToClipboard(chain.code);
    setCopied(ok);
    if (ok) {
      toast.success(t('Chain code copied!'), { description: t('Share it with your team.') });
    }
    setCreated(chain);
    setSubmitting(false);
    onCreated?.();
  }

  async function copyAgain() {
    if (!created) return;
    const ok = await copyToClipboard(created.code);
    setCopied(ok);
    if (ok) toast.success(t('Copied to clipboard'));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        {!created ? (
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>{t('Create a new chain')}</DialogTitle>
              <DialogDescription>
                {t("Chains are shared workspaces. You'll get an 8-character code to invite teammates.")}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-2">
              <Label htmlFor="chain-name">{t('Chain name')}</Label>
              <Input
                id="chain-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Launchpad"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={submitting || !name.trim()}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin-slow" /> : null}
                {t('Create chain')}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div>
            <DialogHeader>
              <DialogTitle>{t('Your chain is ready')}</DialogTitle>
              <DialogDescription>
                {t('Share this code with your team — anyone with it can join {name}.', {
                  name: created.name,
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex items-center gap-2 rounded-lg border-2 border-fg bg-surface-2 px-6 py-4 shadow-brut">
                <code className="font-mono text-3xl font-bold tracking-[0.25em] text-fg sm:text-4xl">
                  {created.code}
                </code>
              </div>
              <Button variant="secondary" size="sm" onClick={copyAgain}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? t('Copied') : t('Copy code')}
              </Button>
            </div>
            <DialogFooter>
              <Button
                variant="primary"
                block
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/chain/${created.id}`);
                  reset();
                }}
              >
                {t('Open chain')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
