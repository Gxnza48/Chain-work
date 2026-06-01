import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ChainPage from './pages/Chain';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { AuthGuard } from './components/layout/AuthGuard';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Toaster } from './components/ui/Toaster';
import { TooltipProvider } from './components/ui/Tooltip';
import { CommandPalette } from './components/command/CommandPalette';
import { ShortcutsDialog } from './components/command/ShortcutsDialog';
import { useAuthStore } from './store/auth';
import { useThemeStore } from './store/theme';
import { useUIStore } from './store/ui';
import { isTypingTarget } from './lib/utils';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const theme = useThemeStore((s) => s.theme);

  // make sure DOM theme class matches store on first paint
  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove('dark', 'light');
    el.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    initialize().then((unsub) => {
      cleanup = unsub;
    });
    return () => {
      cleanup?.();
    };
  }, [initialize]);

  // Global hotkeys: ⌘K / Ctrl+K opens the command palette, "?" opens help.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        useUIStore.getState().togglePalette();
        return;
      }
      if (
        e.key === '?' &&
        !isTypingTarget(e.target) &&
        !useUIStore.getState().paletteOpen
      ) {
        e.preventDefault();
        useUIStore.getState().setShortcutsOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <TooltipProvider delayDuration={150}>
      <ErrorBoundary
        label="app"
        fallback={
          <div className="grid min-h-screen place-items-center bg-bg p-6">
            <div className="w-full max-w-md rounded-lg border-2 border-fg bg-surface p-6 text-center shadow-brut">
              <h1 className="font-display text-2xl font-bold text-fg">Algo se rompió</h1>
              <p className="mt-2 text-sm text-fg-muted">
                Ocurrió un error al cargar la página. Probá recargar.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-md border-2 border-fg bg-accent-blue px-4 py-2 text-sm font-bold text-white shadow-brut-sm active:translate-x-[2px] active:translate-y-[2px]"
              >
                Recargar
              </button>
            </div>
          </div>
        }
      >
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <Settings />
            </AuthGuard>
          }
        />
        <Route
          path="/chain/:chainId"
          element={
            <AuthGuard>
              <ChainPage />
            </AuthGuard>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
        <CommandPalette />
        <ShortcutsDialog />
        <Toaster />
      </ErrorBoundary>
    </TooltipProvider>
  );
}
