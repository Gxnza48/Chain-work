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
import { copyToClipboard, generateChainCode } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

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
    if (!name.trim()) {
      toast.error('Give your chain a name');
      return;
    }
    setSubmitting(true);

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateChainCode(8);
      const { data, error } = await supabase
        .from('chains')
        .insert({ name: name.trim(), code, created_by: user.id })
        .select()
        .single();

      if (!error && data) {
        // Insert membership for the creator (RLS allows self-insert)
        await supabase.from('chain_members').insert({ chain_id: data.id, user_id: user.id });

        const ok = await copyToClipboard(data.code);
        setCopied(ok);
        if (ok) {
          toast.success('Chain code copied!', {
            description: 'Share it with your team.',
          });
        }
        setCreated({ id: data.id, name: data.name, code: data.code });
        setSubmitting(false);
        onCreated?.();
        return;
      }

      // unique violation on code -> retry, otherwise bail
      const code23505 = error && (error.code === '23505' || /duplicate key/.test(error.message));
      if (!code23505) {
        toast.error('Could not create chain', { description: error?.message });
        setSubmitting(false);
        return;
      }
    }

    toast.error('Could not generate a unique chain code. Please try again.');
    setSubmitting(false);
  }

  async function copyAgain() {
    if (!created) return;
    const ok = await copyToClipboard(created.code);
    setCopied(ok);
    if (ok) toast.success('Copied to clipboard');
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
              <DialogTitle>Create a new chain</DialogTitle>
              <DialogDescription>
                Chains are shared workspaces. You'll get an 8-character code to invite teammates.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-2">
              <Label htmlFor="chain-name">Chain name</Label>
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
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !name.trim()}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create chain
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div>
            <DialogHeader>
              <DialogTitle>Your chain is ready</DialogTitle>
              <DialogDescription>
                Share this code with your team — anyone with it can join {created.name}.
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
                {copied ? 'Copied' : 'Copy code'}
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
                Open chain
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
