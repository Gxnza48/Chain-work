import { useEffect, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { gsap } from '@/lib/gsap';
import { Logo } from '@/components/layout/Logo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card } from '@/components/ui/Card';
import { ChainLoader } from '@/components/ui/ChainLoader';
import { useAuth } from '@/hooks/useAuth';
import { cn, prefersReducedMotion } from '@/lib/utils';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const { user, emailConfirmed, loading } = useAuth();
  const [params, setParams] = useSearchParams();
  const initialMode: Mode = params.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<Mode>(initialMode);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!panelRef.current) return;
    if (prefersReducedMotion()) return;
    const tl = gsap.timeline();
    tl.fromTo(
      panelRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' },
    );
    return () => {
      tl.kill();
    };
  }, [mode]);

  function changeMode(next: Mode) {
    setMode(next);
    setParams({ mode: next }, { replace: true });
  }

  if (loading) {
    return <ChainLoader fullscreen label="Loading…" />;
  }

  if (user && emailConfirmed) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen bg-bg text-fg dot-bg noise overflow-hidden">
      <div className="absolute inset-x-0 top-4 z-20 mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-24 sm:px-6">
        <Card className="p-2 sm:p-3">
          <div className="grid grid-cols-2 gap-1 rounded-md border-2 border-fg bg-surface-2 p-1">
            <TabButton active={mode === 'login'} onClick={() => changeMode('login')}>
              Login
            </TabButton>
            <TabButton active={mode === 'register'} onClick={() => changeMode('register')}>
              Register
            </TabButton>
          </div>

          <div ref={panelRef} className="p-4 sm:p-6">
            {mode === 'login' ? <LoginForm /> : <RegisterForm />}
            <p className="mt-6 text-center text-sm text-fg-muted">
              {mode === 'login' ? (
                <>
                  New to ChainWork?{' '}
                  <button
                    type="button"
                    className="font-bold text-accent-blue hover:underline"
                    onClick={() => changeMode('register')}
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already on ChainWork?{' '}
                  <button
                    type="button"
                    className="font-bold text-accent-blue hover:underline"
                    onClick={() => changeMode('login')}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-md px-3 py-2 text-sm font-bold font-display tracking-tight transition-colors',
        active ? 'bg-accent-blue text-white border-2 border-fg' : 'text-fg-muted hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}
