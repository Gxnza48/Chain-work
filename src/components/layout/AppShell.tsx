import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, Settings as SettingsIcon, X } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { initials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r-2 border-fg bg-surface p-4',
          'transition-transform duration-200 ease-out',
          'lg:relative lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <Logo to="/" />
          <button
            className="rounded-md p-1 text-fg-muted hover:bg-surface-2 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold transition-colors',
                  active
                    ? 'border-2 border-fg bg-surface-2 text-fg shadow-brut-sm'
                    : 'border-2 border-transparent text-fg-muted hover:text-fg hover:bg-surface-2',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="absolute inset-x-4 bottom-4 flex flex-col gap-3">
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-lg border-2 border-fg bg-surface-2 p-2.5 hover:bg-surface transition-colors"
          >
            <Avatar className="h-9 w-9">
              {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt={profile.display_name} /> : null}
              <AvatarFallback>{initials(profile?.display_name ?? '?')}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-fg">{profile?.display_name ?? 'Profile'}</p>
              <p className="truncate text-xs text-fg-muted font-mono">@{profile?.username ?? ''}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" block onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between gap-3 border-b-2 border-fg bg-bg px-4 lg:hidden">
        <button
          className="inline-grid h-10 w-10 place-items-center rounded-lg border-2 border-fg bg-surface text-fg shadow-brut-sm"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Logo size="sm" to="/" />
        <ThemeToggle />
      </div>

      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        {children}
      </main>

      {open ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
