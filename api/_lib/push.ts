import type { SupabaseClient } from '@supabase/supabase-js';

// NOTE: heavy deps (@supabase/supabase-js, web-push) are imported DYNAMICALLY
// inside functions, not at module top-level. This keeps the serverless function
// from crashing at load time if bundling of those CJS libs misbehaves.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function serviceClient(): Promise<SupabaseClient> {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// --- VAPID / web-push (lazy) ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _webpush: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function webpushClient(): Promise<any> {
  if (_webpush) return _webpush;
  const mod = await import('web-push');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wp = ((mod as any).default ?? mod) as any;
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  const subject = process.env.VAPID_SUBJECT || 'mailto:agustincasal@impulsex.com.ar';
  if (!publicKey || !privateKey) throw new Error('Missing VAPID keys');
  wp.setVapidDetails(subject, publicKey, privateKey);
  _webpush = wp;
  return wp;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Send a payload to every device of every given user. Cleans up dead subs. */
export async function sendToUsers(
  db: SupabaseClient,
  userIds: string[],
  payload: PushPayload,
): Promise<number> {
  if (userIds.length === 0) return 0;
  const webpush = await webpushClient();

  const { data: subs } = await db
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', userIds);

  const rows = (subs ?? []) as SubscriptionRow[];
  const body = JSON.stringify(payload);
  const dead: string[] = [];
  let sent = 0;

  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          body,
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) dead.push(row.id);
      }
    }),
  );

  if (dead.length) await db.from('push_subscriptions').delete().in('id', dead);
  return sent;
}

/** Bearer-token check for shared-secret protected endpoints. */
export function checkBearer(authHeader: string | undefined, secret: string | undefined): boolean {
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}
