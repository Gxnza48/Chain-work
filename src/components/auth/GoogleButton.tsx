import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { siteUrl } from '@/lib/site-url';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

/** Multi-color Google "G" mark (lucide has no brand logos). */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden className={className}>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.02-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

export function GoogleButton({ label = 'Continue with Google' }: { label?: string }) {
  const t = useT();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // land back on /auth; detectSessionInUrl picks up the session and the
        // page redirects an authenticated, confirmed user to /dashboard.
        redirectTo: siteUrl('/auth'),
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) {
      setLoading(false);
      toast.error(t('Could not start Google sign-in'), { description: error.message });
    }
    // on success the browser navigates away to Google; no need to reset loading.
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        'inline-flex h-12 w-full items-center justify-center gap-3 select-none',
        'rounded-lg border-2 border-fg bg-surface text-fg shadow-brut',
        'font-display font-bold tracking-tight',
        'transition-[transform,box-shadow] duration-150 ease-out',
        'hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brut-lg',
        'active:translate-x-[2px] active:translate-y-[2px] active:shadow-brut-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:pointer-events-none disabled:opacity-50',
      )}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <GoogleMark className="h-5 w-5" />
      )}
      {t(label)}
    </button>
  );
}
