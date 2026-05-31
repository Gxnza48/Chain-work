import { create } from 'zustand';

export type Lang = 'es' | 'en';

const STORAGE_KEY = 'chainwork-lang';

function readInitial(): Lang {
  if (typeof window === 'undefined') return 'es';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'es' || saved === 'en') return saved;
  // Default to English only for clearly-English browsers; otherwise Spanish (LATAM).
  const nav = window.navigator?.language?.toLowerCase() ?? '';
  return nav.startsWith('en') ? 'en' : 'es';
}

function persist(lang: Lang): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore quota errors
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
}

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

export const useLangStore = create<LangState>((set, get) => ({
  lang: readInitial(),
  setLang: (lang) => {
    persist(lang);
    set({ lang });
  },
  toggle: () => {
    const next: Lang = get().lang === 'es' ? 'en' : 'es';
    persist(next);
    set({ lang: next });
  },
}));

// keep <html lang> in sync on first load
if (typeof document !== 'undefined') {
  document.documentElement.lang = useLangStore.getState().lang;
}
