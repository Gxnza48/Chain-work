import { lazy, Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
const Landing = lazy(() => import("./pages/Landing"));
const AuthPage = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ChainPage = lazy(() => import("./pages/Chain"));
const Settings = lazy(() => import("./pages/Settings"));
const Changelog = lazy(() => import("./pages/Changelog"));
import NotFound from "./pages/NotFound";
import { AuthGuard } from "./components/layout/AuthGuard";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { Toaster } from "./components/ui/Toaster";
import { TooltipProvider } from "./components/ui/Tooltip";
import { CommandPalette } from "./components/command/CommandPalette";
import { ShortcutsDialog } from "./components/command/ShortcutsDialog";
import { useAuthStore } from "./store/auth";
import { useThemeStore } from "./store/theme";
import { useUIStore } from "./store/ui";
import { isTypingTarget } from "./lib/utils";
import { AppearanceProvider } from "./components/ui/appearance";

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const theme = useThemeStore((s) => s.theme);

  // make sure DOM theme class matches store on first paint
  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove("dark", "light");
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
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        useUIStore.getState().togglePalette();
        return;
      }
      if (
        e.key === "?" &&
        !isTypingTarget(e.target) &&
        !useUIStore.getState().paletteOpen
      ) {
        e.preventDefault();
        useUIStore.getState().setShortcutsOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AppearanceProvider>
      <TooltipProvider delayDuration={150}>
        <ErrorBoundary
          label="app"
          fallback={
            <div className="grid min-h-screen place-items-center bg-bg p-6">
              <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 text-center shadow-soft">
                <h1 className="font-display text-2xl font-bold text-fg">
                  Algo se rompió
                </h1>
                <p className="mt-2 text-sm text-fg-muted">
                  Ocurrió un error al cargar la página. Probá recargar.
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-md border border-border bg-accent-blue px-4 py-2 text-sm font-bold text-white shadow-soft "
                >
                  Recargar
                </button>
              </div>
            </div>
          }
        >
          <Suspense
            fallback={
              <div className="min-h-screen bg-bg p-8" role="status">
                <div className="skeleton mx-auto mt-20 h-32 max-w-xl" />
                <span className="sr-only">Loading…</span>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/changelog" element={<Changelog />} />
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
          </Suspense>
          <CommandPalette />
          <ShortcutsDialog />
          <Toaster />
        </ErrorBoundary>
      </TooltipProvider>
    </AppearanceProvider>
  );
}
