import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  isIOS,
  isStandalone,
  isSubscribed,
  notificationPermission,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push';

export interface PushState {
  supported: boolean;
  /** iOS in a normal tab can't do push — must install the PWA first. */
  needsInstall: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  busy: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}

export function usePushNotifications(): PushState {
  const { user } = useAuth();
  const supported = pushSupported();
  const needsInstall = isIOS() && !isStandalone();
  const [permission, setPermission] = useState<NotificationPermission>(notificationPermission());
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supported) return;
    isSubscribed().then(setSubscribed).catch(() => setSubscribed(false));
  }, [supported]);

  const enable = useCallback(async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const ok = await subscribeToPush(user.id);
      setSubscribed(ok);
      setPermission(notificationPermission());
    } finally {
      setBusy(false);
    }
  }, [user, busy]);

  const disable = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return { supported, needsInstall, permission, subscribed, busy, enable, disable };
}
