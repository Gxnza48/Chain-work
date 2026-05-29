import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ChainRow, UserRow } from '@/types';

interface ChainData {
  chain: ChainRow | null;
  members: UserRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useChain(chainId: string | undefined): ChainData {
  const [chain, setChain] = useState<ChainRow | null>(null);
  const [members, setMembers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!chainId) return;
    setLoading(true);
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
      .select('user_id, joined_at, users(*)')
      .eq('chain_id', chainId);

    const memberList: UserRow[] = (memberData ?? [])
      .map((m) => (m as unknown as { users: UserRow }).users)
      .filter(Boolean);
    setMembers(memberList);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // also subscribe to membership inserts/deletes
    if (!chainId) return;
    const channel = supabase
      .channel(`chain-members:${chainId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chain_members', filter: `chain_id=eq.${chainId}` },
        () => {
          load();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId]);

  return { chain, members, loading, error, refresh: load };
}
