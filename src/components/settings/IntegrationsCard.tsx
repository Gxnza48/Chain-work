import { useMemo, useState } from 'react';
import { Check, Copy, KeyRound, Loader2, Plug, Plus, Terminal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useMcpTokens } from '@/hooks/useMcpTokens';
import { useT } from '@/lib/i18n';
import { copyToClipboard, relativeTime } from '@/lib/utils';

// The deployed Supabase Edge Function is named `dynamic-task` (the dashboard's
// default name when it was created). The MCP server code lives there.
const MCP_ENDPOINT = `${(import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? 'https://<your-project>.supabase.co'}/functions/v1/dynamic-task`;

function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={label}
      onClick={async () => {
        const ok = await copyToClipboard(value);
        if (ok) {
          setCopied(true);
          toast.success(t('Copied to clipboard'));
          setTimeout(() => setCopied(false), 1500);
        } else {
          toast.error(t('Could not copy'));
        }
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? t('Copied') : t('Copy')}
    </Button>
  );
}

export function IntegrationsCard() {
  const t = useT();
  const { tokens, loading, create, revoke } = useMcpTokens();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [freshToken, setFreshToken] = useState<string | null>(null);

  const connectCommand = useMemo(() => {
    const key = freshToken ?? 'cw_live_xxxxxxxxxxxx';
    return `claude mcp add --transport http chainwork ${MCP_ENDPOINT} --header "Authorization: Bearer ${key}"`;
  }, [freshToken]);

  async function handleCreate() {
    if (busy) return;
    setBusy(true);
    try {
      const raw = await create(name);
      setFreshToken(raw);
      setName('');
      toast.success(t('API key created'));
    } catch {
      toast.error(t('Could not create API key'));
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!window.confirm(t('Revoke this API key? Any Claude Code using it will stop working.'))) return;
    try {
      await revoke(id);
      toast.success(t('API key revoked'));
    } catch {
      toast.error(t('Could not revoke API key'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="h-5 w-5" />
          {t('MCP for Claude Code')}
        </CardTitle>
        <CardDescription>
          {t(
            'Connect Claude Code to ChainWork. Generate a key, run one command, then tell Claude Code to do a chain’s next task and mark it done.',
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* What you can say */}
        <div className="rounded-md border-2 border-dashed border-fg bg-surface-2 p-4 text-sm">
          <p className="font-semibold">{t('Then just say to Claude Code:')}</p>
          <p className="mt-1 text-fg-muted">
            {t('“From chain AB12CD34, do the next task, push the changes to GitHub and mark it completed.”')}
          </p>
        </div>

        {/* Freshly generated token — shown once */}
        {freshToken ? (
          <div className="rounded-md border-2 border-accent-emerald bg-surface p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-accent-emerald">
              <KeyRound className="h-4 w-4" />
              {t('Your new API key')}
            </p>
            <p className="mt-1 text-xs text-fg-muted">{t("Copy it now — you won't be able to see it again.")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-0 break-all rounded-md border-2 border-fg bg-surface-2 px-3 py-2 font-mono text-sm">
                {freshToken}
              </code>
              <CopyButton value={freshToken} label={t('Copy API key')} />
            </div>
          </div>
        ) : null}

        {/* Connect command */}
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Terminal className="h-4 w-4" />
            {freshToken ? t('Run this to connect Claude Code:') : t('Connect command (uses your key):')}
          </p>
          <div className="flex flex-wrap items-start gap-2">
            <code className="flex-1 min-w-0 break-all rounded-md border-2 border-fg bg-surface-2 px-3 py-2 font-mono text-xs leading-relaxed">
              {connectCommand}
            </code>
            <CopyButton value={connectCommand} label={t('Copy command')} />
          </div>
        </div>

        {/* Generate a key */}
        <div className="flex flex-col gap-2 border-t-2 border-fg pt-4">
          <p className="text-sm font-semibold">{t('API keys')}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('Key name (e.g. My laptop)')}
              className="h-9 flex-1 min-w-[12rem] text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate();
              }}
            />
            <Button type="button" size="sm" onClick={handleCreate} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {t('Generate API key')}
            </Button>
          </div>

          {/* Existing keys */}
          {loading ? (
            <p className="text-sm text-fg-muted">{t('Loading…')}</p>
          ) : tokens.length === 0 ? (
            <p className="text-sm text-fg-muted">{t('No API keys yet.')}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {tokens.map((tok) => (
                <li
                  key={tok.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border-2 border-fg bg-surface-2 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{tok.name}</p>
                    <p className="font-mono text-xs text-fg-muted">
                      {tok.prefix}… ·{' '}
                      {tok.last_used_at
                        ? t('used {time}', { time: relativeTime(tok.last_used_at) })
                        : t('never used')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={t('Revoke')}
                    onClick={() => handleRevoke(tok.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('Revoke')}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
