import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#faq', label: 'FAQ' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-1 z-50 mx-auto w-full max-w-7xl px-4 sm:px-6',
        'transition-[padding] duration-200 ease-out',
      )}
    >
      <div
        className={cn(
          'flex h-16 items-center justify-between gap-4 rounded-lg px-4 sm:px-6 transition-all duration-200',
          scrolled
            ? 'border-2 border-fg bg-bg/80 backdrop-blur-md shadow-brut-sm'
            : 'border-2 border-transparent bg-transparent',
        )}
      >
        <Logo size="md" />

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-semibold text-fg-muted transition-colors hover:bg-surface hover:text-fg"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button asChild size="md" variant="primary">
            <Link to="/auth?mode=register">Sign Up</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
            className="inline-grid h-10 w-10 place-items-center rounded-lg border-2 border-fg bg-surface text-fg shadow-brut-sm"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="mt-2 rounded-lg border-2 border-fg bg-surface shadow-brut p-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-semibold text-fg hover:bg-surface-2"
              >
                {item.label}
              </a>
            ))}
            <Button asChild size="md" variant="primary" block className="mt-2">
              <Link to="/auth?mode=register" onClick={() => setOpen(false)}>
                Sign Up
              </Link>
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
