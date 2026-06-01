import { supabase } from '@/lib/supabase';

// VAPID public key is NOT secret — it ships in the client bundle. Env var wins;
// the constant is a fallback so push works even if the env var isn't set.
const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BKaz7-uAxEGH-VnWLMjoYBVkLfrFv1JPDfatH5OtD4zofedUHm4z391kMTCJU8cVzV90p1xgFObyuoZjkroQMVc';

export type NotifyEvent = 'todo' | 'idea' | 'file' | 'join';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** True when running as an installed PWA (home-screen / standalone window). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function notificationPermission(): NotificationPermission {
  if (typeof Notification === 'undefined') return 'default';
  return Notification.permission;
}

/** Is this device currently subscribed to push? */
export async function isSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return Boolean(sub);
}

/**
 * Request permission, subscribe via the SW push manager, and persist the
 * subscription for `userId`. Returns true on success. Throws on hard errors so
 * the UI can show a message.
 */
export async function subscribeToPush(userId: string): Promise<boolean> {
  if (!pushSupported()) throw new Error('unsupported');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });
  }

  const json = sub.toJSON();
  const keys = json.keys ?? {};
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: keys.p256dh ?? '',
      auth: keys.auth ?? '',
      user_agent: navigator.userAgent,
    },
    { onConflict: 'endpoint' },
  );
  if (error) throw error;
  return true;
}

/** Unsubscribe this device and remove its stored subscription. */
export async function unsubscribeFromPush(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe().catch(() => {});
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
}

/**
 * Fire-and-forget: tell the server to push a notification to the other chain
 * members about an action the current user just performed. Never throws — a
 * failed notification must not break the action that triggered it.
 */
export async function notifyEvent(
  event: NotifyEvent,
  payload: { id?: string; chainId?: string },
): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ event, ...payload }),
      keepalive: true,
    });
  } catch {
    /* best-effort */
  }
}

export interface PingResult {
  ok: boolean;
  status: number;
  /** Seconds remaining on the 12h cooldown when status === 429. */
  retryAfter?: number;
  error?: string;
}

/**
 * Manually nudge (bell) the assignees of a todo with a push. Unlike notifyEvent
 * this RETURNS the result so the UI can show success / cooldown / error toasts.
 */
export async function pingTodo(todoId: string): Promise<PingResult> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { ok: false, status: 401, error: 'no-session' };
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ event: 'nudge', id: todoId }),
    });
    const json = (await res.json().catch(() => ({}))) as { retryAfter?: number; error?: string };
    return { ok: res.ok, status: res.status, retryAfter: json.retryAfter, error: json.error };
  } catch (err) {
    return { ok: false, status: 0, error: (err as Error).message };
  }
}
