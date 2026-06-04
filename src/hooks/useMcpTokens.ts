import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

/**
 * Personal ChainWork API keys for the MCP server (Claude Code integration).
 *
 * The RAW token is generated and shown ONCE in the browser; only its SHA-256
 * hash is ever stored (table `mcp_tokens`, RLS = own rows only). The MCP Edge
 * Function re-hashes the presented key and looks it up by hash — so the same
 * hashing must be used on both sides (plain SHA-256 hex of the raw string).
 */

export interface McpToken {
  id: string;
  name: string;
  prefix: string;
  last_used_at: string | null;
  created_at: string;
}

async function sha256hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Generate a high-entropy raw token like `cw_live_<32 url-safe chars>`. */
function genRawToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const body = btoa(bin).replace(/\+/g, 'x').replace(/\//g, 'y').replace(/=/g, '');
  return `cw_live_${body.slice(0, 32)}`;
}

export function useMcpTokens() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<McpToken[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setTokens([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('mcp_tokens')
      .select('id, name, prefix, last_used_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setTokens((data as McpToken[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Create a key; returns the RAW token (show it once, it can't be recovered). */
  const create = useCallback(
    async (name: string): Promise<string> => {
      if (!user) throw new Error('not signed in');
      const raw = genRawToken();
      const token_hash = await sha256hex(raw);
      const prefix = raw.slice(0, 12);
      const { error } = await supabase.from('mcp_tokens').insert({
        user_id: user.id,
        name: name.trim() || 'Claude Code',
        token_hash,
        prefix,
      });
      if (error) throw error;
      await load();
      return raw;
    },
    [user, load],
  );

  const revoke = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('mcp_tokens').delete().eq('id', id);
      if (error) throw error;
      await load();
    },
    [load],
  );

  return { tokens, loading, create, revoke, reload: load };
}
