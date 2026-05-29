import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { PresenceMember } from '@/types';

const LAST_SEEN_INTERVAL_MS = 60_000;
const ONLINE_WINDOW_MS = 2 * 60_000;

interface Result {
  online: Record<string, PresenceMember>;
  isOnline: (userId: string) => boolean;
}

export function usePresence(chainId: string | undefined): Result {
  const { user, profile } = useAuth();
  const [online, setOnline] = useState<Record<string, PresenceMember>>({});

  useEffect(() => {
    if (!chainId || !user || !profile) return;

    const channel = supabase.channel(`chain:${chainId}`, {
      config: {
        presence: { key: user.id },
      },
    });

    const handlePresenceSync = () => {
      const state = channel.presenceState<PresenceMember>();
      const next: Record<string, PresenceMember> = {};
      const now = Date.now();
      for (const id of Object.keys(state)) {
        const list = state[id];
        if (!list || list.length === 0) continue;
        const newest = list.reduce((acc, cur) =>
          new Date(cur.online_at).getTime() > new Date(acc.online_at).getTime() ? cur : acc,
        );
        if (now - new Date(newest.online_at).getTime() < ONLINE_WINDOW_MS) {
          next[id] = newest;
        }
      }
      setOnline(next);
    };

    channel.on('presence', { event: 'sync' }, handlePresenceSync);
    channel.on('presence', { event: 'join' }, handlePresenceSync);
    channel.on('presence', { event: 'leave' }, handlePresenceSync);

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          display_name: profile.display_name,
          username: profile.username,
          avatar_url: profile.avatar_url,
          online_at: new Date().toISOString(),
        } satisfies PresenceMember);
      }
    });

    // periodic last_seen patch
    const patchLastSeen = async () => {
      try {
        await supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', user.id);
      } catch {
        // ignore
      }
    };
    patchLastSeen();
    const tick = window.setInterval(patchLastSeen, LAST_SEEN_INTERVAL_MS);

    const onBlur = () => patchLastSeen();
    const onBeforeUnload = () => {
      patchLastSeen();
      channel.untrack().catch(() => {});
    };
    window.addEventListener('blur', onBlur);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.clearInterval(tick);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('beforeunload', onBeforeUnload);
      channel.untrack().catch(() => {});
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [chainId, user, profile]);

  return {
    online,
    isOnline: (userId: string) => Boolean(online[userId]),
  };
}
