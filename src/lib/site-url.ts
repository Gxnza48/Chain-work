/**
 * Canonical site URL used for auth redirects (email confirmation, password reset,
 * OAuth callbacks).
 *
 * In production set `VITE_SITE_URL` to the deployed origin (e.g.
 * `https://chainwork-team.vercel.app`) so confirmation links never point at a
 * preview/localhost origin. Locally, leave it unset and we fall back to the
 * current window origin so dev signups still work against `localhost`.
 *
 * NOTE: the URL you produce here must also be added to Supabase ->
 * Authentication -> URL Configuration (Site URL + Redirect URLs allowlist),
 * otherwise Supabase ignores `redirect_to` and falls back to its Site URL.
 */
export function getSiteURL(): string {
  const fromEnv = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  const base = fromEnv || window.location.origin;
  // strip any trailing slashes so we can safely append paths
  return base.replace(/\/+$/, '');
}

/** Build an absolute URL on the canonical site origin. */
export function siteUrl(path = ''): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteURL()}${path ? clean : ''}`;
}
