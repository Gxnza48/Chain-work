import { create } from 'zustand';
import type { Theme } from '@/types';

const STORAGE_KEY = 'chainwork-theme';

function readInitial(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return 'dark';
}

function apply(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  el.classList.remove('dark', 'light');
  el.classList.add(theme);
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore quota errors
  }
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readInitial(),
  setTheme: (theme) => {
    apply(theme);
    set({ theme });
  },
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    apply(next);
    set({ theme: next });
  },
}));

// ensure the boot-script class matches state on first render
if (typeof document !== 'undefined') {
  apply(useThemeStore.getState().theme);
}
