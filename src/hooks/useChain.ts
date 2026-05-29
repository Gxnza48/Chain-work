import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import type { ChainMemberProfile, ChainRole, ChainRow, UserRow } from '@/types';

interface ChainData {
  chain: ChainRow | null;
  members: ChainMemberProfile[];
  myRole: ChainRole | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useChain(chainId: string | undefined): ChainData {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [chain, setChain] = useState<ChainRow | null>(null);
  const [members, setMembers] = useState<ChainMemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(opts?: { silent?: boolean }) {
    if (!chainId) return;
    if (!opts?.silent) setLoading(true);
    setError(null);
    const { data: chainData, error: chainErr } = await supabase
      .from('chains')
      .select('*')
      .eq('id', chainId)
      .maybeSingle();

    if (chainErr || !chainData) {
      setError(chainErr?.message ?? 'Chain not found');
      setChain(null);
      setMembers([]);
      setLoading(false);
      return;
    }
    setChain(chainData);

    const { data: memberData } = await supabase
      .from('chain_members')
      .select('user_id, role, joined_at, users(*)')
      .eq('chain_id', chainId);

    const memberList: ChainMemberProfile[] = (memberData ?? [])
      .map((m) => {
        const row = m as unknown as { role: ChainRole; users: UserRow };
        if (!row.users) return null;
        return { ...row.users, role: row.role ?? 'member' };
      })
      .filter((m): m is ChainMemberProfile => Boolean(m));
    setMembers(memberList);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // also subscribe to membership inserts/updates/deletes
    if (!chainId) return;
    const channel = supabase
      .channel(`chain-members:${chainId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chain_members', filter: `chain_id=eq.${chainId}` },
        () => {
          load({ silent: true });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId]);

  const myRole: ChainRole | null = userId
    ? members.find((m) => m.id === userId)?.role ?? null
    : null;

  return { chain, members, myRole, loading, error, refresh: () => load({ silent: true }) };
}
