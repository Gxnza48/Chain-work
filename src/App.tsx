import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ChainPage from './pages/Chain';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import { AuthGuard } from './components/layout/AuthGuard';
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
    </TooltipProvider>
  );
}
