import { create } from 'zustand';

/**
 * Small global UI store for app-wide overlays that any component (or a global
 * hotkey) needs to open: the command palette (⌘K / Ctrl+K) and the keyboard
 * shortcuts help dialog (?).
 */
interface UIState {
  paletteOpen: boolean;
  shortcutsOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  togglePalette: () => void;
  setShortcutsOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  paletteOpen: false,
  shortcutsOpen: false,
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  togglePalette: () => set({ paletteOpen: !get().paletteOpen }),
  setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
}));
