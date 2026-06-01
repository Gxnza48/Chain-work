import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { deviceType } from '@/lib/utils';
import { useAuth } from './useAuth';
import type { DeviceKind, PresenceMember } from '@/types';

const LAST_SEEN_INTERVAL_MS = 45_000;
const ONLINE_WINDOW_MS = 2 * 60_000;

interface Result {
  online: Record<string, PresenceMember>;
  isOnline: (userId: string) => boolean;
  /** Best-known "last online" ISO time for a user (from presence), if any. */
  lastSeenAt: (userId: string) => string | null;
  /** Device a user is currently online from, if known. */
  deviceOf: (userId: string) => DeviceKind | null;
}

export function usePresence(chainId: string | undefined): Result {
  const { user, profile } = useAuth();
  const [online, setOnline] = useState<Record<string, PresenceMember>>({});
  // Tracks the most recent moment we observed each user online — updated while
  // they're present and stamped to "now" the instant they leave, so other
  // clients show an accurate "last online" instead of a stale DB value.
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!chainId || !user || !profile) return;

    const channel = supabase.channel(`chain:${chainId}`, {
      config: {
        presence: { key: user.id },
      },
    });

    const recompute = () => {
      const state = channel.presenceState<PresenceMember>();
      const next: Record<string, PresenceMember> = {};
      const seen: Record<string, string> = {};
      const now = Date.now();
      for (const id of Object.keys(state)) {
        const list = state[id];
        if (!list || list.length === 0) continue;
        const newest = list.reduce((acc, cur) =>
          new Date(cur.online_at).getTime() > new Date(acc.online_at).getTime() ? cur : acc,
        );
        if (now - new Date(newest.online_at).getTime() < ONLINE_WINDOW_MS) {
          next[id] = newest;
          // while present, their "last seen" is effectively now
          seen[id] = new Date().toISOString();
        }
      }
      setOnline(next);
      setLastSeen((prev) => ({ ...prev, ...seen }));
    };

    const handleLeave = (payload: { key?: string }) => {
      // the moment a user leaves, "last online" is right now
      if (payload?.key) {
        const key = payload.key;
        setLastSeen((prev) => ({ ...prev, [key]: new Date().toISOString() }));
      }
      recompute();
    };

    channel.on('presence', { event: 'sync' }, recompute);
    channel.on('presence', { event: 'join' }, recompute);
    channel.on('presence', { event: 'leave' }, handleLeave);

    const track = () =>
      channel.track({
        user_id: user.id,
        display_name: profile.display_name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        online_at: new Date().toISOString(),
        device: deviceType(),
      } satisfies PresenceMember);

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await track();
      }
    });

    const patchLastSeen = async () => {
      try {
        await supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', user.id);
      } catch {
        // ignore
      }
    };
    patchLastSeen();

    // Keep our presence fresh (online_at within the window) and our DB
    // last_seen current, so others never see us "expire" while we're here.
    const tick = window.setInterval(() => {
      patchLastSeen();
      track();
    }, LAST_SEEN_INTERVAL_MS);

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
    lastSeenAt: (userId: string) => lastSeen[userId] ?? null,
    deviceOf: (userId: string) => online[userId]?.device ?? null,
  };
}
