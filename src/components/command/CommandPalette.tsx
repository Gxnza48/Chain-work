import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CornerDownLeft,
  Folder,
  Home,
  Keyboard,
  LayoutDashboard,
  Languages,
  Link2,
  LogOut,
  Moon,
  Search,
  Settings as SettingsIcon,
  Sun,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { useThemeStore } from '@/store/theme';
import { useLangStore } from '@/store/lang';
import { useUIStore } from '@/store/ui';
import { getRecentProjects } from '@/lib/recent';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
}

/**
 * App-wide command palette (⌘K / Ctrl+K). Fuzzy-jump to any chain or recent
 * project and run quick actions (theme, language, navigation, sign out).
 * Purely client-side. Rendered once, globally, from App.
 */
export function CommandPalette() {
  const open = useUIStore((s) => s.paletteOpen);
  const setOpen = useUIStore((s) => s.setPaletteOpen);
  const setShortcutsOpen = useUIStore((s) => s.setShortcutsOpen);
  const navigate = useNavigate();
  const t = useT();

  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const lang = useLangStore((s) => s.lang);
  const toggleLang = useLangStore((s) => s.toggle);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [chains, setChains] = useState<{ id: string; name: string }[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Reset + focus + fetch the user's chains each time the palette opens.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelected(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);
    if (user) {
      supabase
        .from('chain_members')
        .select('chain_id, chains(name)')
        .eq('user_id', user.id)
        .then(({ data }) => {
          const list = (data ?? [])
            .map((row) => {
              const r = row as unknown as { chain_id: string; chains: { name: string } | null };
              return r.chains ? { id: r.chain_id, name: r.chains.name } : null;
            })
            .filter((c): c is { id: string; name: string } => Boolean(c));
          setChains(list);
        });
    }
    return () => window.clearTimeout(id);
  }, [open, user]);

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = [];
    if (user) {
      list.push({
        id: 'nav-dashboard',
        group: t('Go to'),
        label: t('Dashboard'),
        icon: <LayoutDashboard className="h-4 w-4" />,
        run: () => navigate('/dashboard'),
      });
      list.push({
        id: 'nav-settings',
        group: t('Go to'),
        label: t('Settings'),
        icon: <SettingsIcon className="h-4 w-4" />,
        run: () => navigate('/settings'),
      });
    }
    list.push({
      id: 'nav-home',
      group: t('Go to'),
      label: t('Home page'),
      icon: <Home className="h-4 w-4" />,
      run: () => navigate('/'),
    });

    for (const c of chains) {
      list.push({
        id: `chain-${c.id}`,
        group: t('Chains'),
        label: c.name,
        hint: t('Chain'),
        icon: <Link2 className="h-4 w-4" />,
        run: () => navigate(`/chain/${c.id}`),
      });
    }

    for (const r of getRecentProjects()) {
      list.push({
        id: `recent-${r.projectId}`,
        group: t('Recent projects'),
        label: r.name,
        hint: r.chainName,
        icon: <Folder className="h-4 w-4" />,
        run: () => navigate(`/chain/${r.chainId}?project=${r.projectId}`),
      });
    }

    list.push({
      id: 'toggle-theme',
      group: t('Actions'),
      label: t('Switch to {theme} theme', { theme: t(theme === 'dark' ? 'light' : 'dark') }),
      icon: theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
      run: toggleTheme,
    });
    list.push({
      id: 'toggle-lang',
      group: t('Actions'),
      label: lang === 'es' ? t('Switch to English') : t('Switch to Spanish'),
      icon: <Languages className="h-4 w-4" />,
      run: toggleLang,
    });
    list.push({
      id: 'shortcuts',
      group: t('Actions'),
      label: t('Keyboard shortcuts'),
      hint: '?',
      icon: <Keyboard className="h-4 w-4" />,
      run: () => setShortcutsOpen(true),
    });
    if (user) {
      list.push({
        id: 'sign-out',
        group: t('Actions'),
        label: t('Sign out'),
        icon: <LogOut className="h-4 w-4" />,
        run: () => {
          void signOut().then(() => navigate('/', { replace: true }));
        },
      });
    }
    return list;
  }, [user, chains, theme, lang, t, navigate, toggleTheme, toggleLang, setShortcutsOpen, signOut]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.hint ?? ''} ${c.group}`.toLowerCase().includes(q),
    );
  }, [commands, query]);

  useEffect(() => {
    setSelected((s) => Math.min(s, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  function runAt(index: number) {
    const cmd = filtered[index];
    if (!cmd) return;
    setOpen(false);
    cmd.run();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => (filtered.length ? (s + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => (filtered.length ? (s - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runAt(selected);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  }

  // keep the highlighted row in view
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${selected}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!open) return null;

  let lastGroup = '';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-lg border-2 border-fg bg-surface shadow-brut-lg">
        <div className="flex items-center gap-2 border-b-2 border-fg px-3">
          <Search className="h-4 w-4 shrink-0 text-fg-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={t('Search chains, projects, actions…')}
            className="h-12 w-full bg-transparent text-base font-medium text-fg outline-none placeholder:text-fg-muted"
            aria-label={t('Command palette')}
          />
          <kbd className="hidden shrink-0 rounded border-2 border-fg bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-bold text-fg-muted sm:block">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[55vh] overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-fg-muted">{t('No results')}</p>
          ) : (
            filtered.map((cmd, i) => {
              const showGroup = cmd.group !== lastGroup;
              lastGroup = cmd.group;
              return (
                <div key={cmd.id}>
                  {showGroup ? (
                    <p className="px-2 pb-1 pt-2 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-fg-muted">
                      {cmd.group}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    data-index={i}
                    onMouseMove={() => setSelected(i)}
                    onClick={() => runAt(i)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-md border-2 px-2.5 py-2 text-left text-sm font-semibold transition-colors',
                      i === selected
                        ? 'border-fg bg-accent-blue text-white shadow-brut-sm'
                        : 'border-transparent text-fg hover:bg-surface-2',
                    )}
                  >
                    <span className={cn('shrink-0', i === selected ? 'text-white' : 'text-fg-muted')}>
                      {cmd.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{cmd.label}</span>
                    {cmd.hint ? (
                      <span
                        className={cn(
                          'shrink-0 font-mono text-[11px]',
                          i === selected ? 'text-white/80' : 'text-fg-muted',
                        )}
                      >
                        {cmd.hint}
                      </span>
                    ) : null}
                    {i === selected ? <CornerDownLeft className="h-3.5 w-3.5 shrink-0" /> : null}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
