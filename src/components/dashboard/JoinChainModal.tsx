import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoined?: () => void;
}

export function JoinChainModal({ open, onOpenChange, onJoined }: Props) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setCode('');
    setError(null);
    setSubmitting(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 8) {
      setError('Codes are 8 characters');
      return;
    }
    setSubmitting(true);
    const { data, error: rpcErr } = await supabase.rpc('join_chain_by_code', { p_code: trimmed });
    setSubmitting(false);
    if (rpcErr) {
      if (/CHAIN_NOT_FOUND/.test(rpcErr.message) || rpcErr.code === 'P0002') {
        setError('That code doesn\'t match a chain');
      } else {
        setError(rpcErr.message);
      }
      return;
    }
    const chainId = data as unknown as string;
    onJoined?.();
    toast.success('Joined chain');
    onOpenChange(false);
    reset();
    navigate(`/chain/${chainId}`);
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
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Join a chain</DialogTitle>
            <DialogDescription>
              Paste the 8-character code your teammate shared with you.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label htmlFor="chain-code">Chain code</Label>
            <Input
              id="chain-code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
                if (error) setError(null);
              }}
              placeholder="A3F9KX2M"
              className="text-center font-mono text-2xl tracking-[0.25em] uppercase"
              maxLength={8}
              autoFocus
              error={Boolean(error)}
            />
            {error ? <p className="text-xs font-semibold text-accent-rose">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || code.length !== 8}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Join
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
