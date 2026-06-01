import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { useUIStore } from '@/store/ui';
import { useT } from '@/lib/i18n';

/** Detect Apple platforms so we can show ⌘ instead of Ctrl in the hints. */
function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
}

export function ShortcutsDialog() {
  const open = useUIStore((s) => s.shortcutsOpen);
  const setOpen = useUIStore((s) => s.setShortcutsOpen);
  const t = useT();
  const mod = isMac() ? '⌘' : 'Ctrl';

  const rows: { keys: string[]; label: string }[] = [
    { keys: [mod, 'K'], label: t('Open the command palette') },
    { keys: ['?'], label: t('Show this shortcuts help') },
    { keys: ['N'], label: t('New todo (inside a project)') },
    { keys: ['/'], label: t('Focus the todo search') },
    { keys: ['Esc'], label: t('Close any dialog or menu') },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Keyboard shortcuts')}</DialogTitle>
          <DialogDescription>{t('Move faster around ChainWork.')}</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-1.5 py-2">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5"
            >
              <span className="text-sm font-medium text-fg">{row.label}</span>
              <span className="flex shrink-0 items-center gap-1">
                {row.keys.map((k) => (
                  <kbd
                    key={k}
                    className="min-w-[1.75rem] rounded-md border-2 border-fg bg-surface-2 px-1.5 py-0.5 text-center font-mono text-xs font-bold text-fg shadow-brut-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
