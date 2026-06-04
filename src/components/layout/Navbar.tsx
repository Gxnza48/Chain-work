import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useT } from '@/lib/i18n';
import { cn, initials } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#developers', label: 'Developers' },
  { href: '#faq', label: 'FAQ' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, profile, loading } = useAuth();
  const t = useT();
  const authed = Boolean(user);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-3 z-50 mx-auto w-full max-w-7xl px-4 sm:px-6',
        'transition-all duration-300 ease-out',
      )}
    >
      <div
        className={cn(
          'flex h-16 items-center justify-between gap-4 rounded-xl px-3 sm:px-5 transition-all duration-300',
          scrolled
            ? 'border-2 border-fg bg-bg/85 backdrop-blur-md shadow-brut'
            : 'border-2 border-transparent bg-transparent',
        )}
      >
        <Logo size="md" to="/" />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group relative rounded-md px-3 py-2 text-sm font-semibold text-fg-muted transition-colors hover:text-fg"
            >
              {t(item.label)}
              <span className="absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-accent-blue transition-transform duration-200 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageToggle />
          <ThemeToggle />
          {loading ? (
            <Skeleton className="h-11 w-32 rounded-lg" />
          ) : authed ? (
            <Link
              to="/dashboard"
              className="group flex items-center gap-2.5 rounded-lg border-2 border-fg bg-surface py-1.5 pl-1.5 pr-3 shadow-brut-sm transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brut"
            >
              <Avatar className="h-8 w-8 border-2 border-fg">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
                ) : null}
                <AvatarFallback className="text-xs">
                  {initials(profile?.display_name ?? user?.email ?? '?')}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[10rem] truncate text-sm font-display font-bold tracking-tight">
                {profile?.display_name ?? t('Dashboard')}
              </span>
              <ArrowRight className="h-4 w-4 text-fg-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <>
              <Button asChild size="md" variant="ghost">
                <Link to="/auth?mode=login">{t('Log in')}</Link>
              </Button>
              <Button asChild size="md" variant="primary">
                <Link to="/auth?mode=register">{t('Sign Up')}</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageToggle />
          <ThemeToggle />
          <button
            type="button"
            aria-label={open ? t('Close menu') : t('Open menu')}
            onClick={() => setOpen((v) => !v)}
            className="inline-grid h-10 w-10 place-items-center rounded-lg border-2 border-fg bg-surface text-fg shadow-brut-sm"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="mt-2 rounded-xl border-2 border-fg bg-surface shadow-brut p-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-semibold text-fg hover:bg-surface-2"
              >
                {t(item.label)}
              </a>
            ))}
            {loading ? null : authed ? (
              <Button asChild size="md" variant="primary" block className="mt-2">
                <Link to="/dashboard" onClick={() => setOpen(false)}>
                  <LayoutDashboard className="h-4 w-4" />
                  {t('Go to dashboard')}
                </Link>
              </Button>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                <Button asChild size="md" variant="outline" block>
                  <Link to="/auth?mode=login" onClick={() => setOpen(false)}>
                    {t('Log in')}
                  </Link>
                </Button>
                <Button asChild size="md" variant="primary" block>
                  <Link to="/auth?mode=register" onClick={() => setOpen(false)}>
                    {t('Sign Up')}
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
