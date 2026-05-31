import { useLangStore } from '@/store/lang';
import { useT } from '@/lib/i18n';
import { Flag } from '@/components/ui/Flag';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
}

/**
 * Compact language switcher. Shows the current language's flag + code and
 * toggles between Spanish (LATAM) and English on click. Flags come from the
 * flagcdn image API (emoji flags don't render reliably on desktop).
 */
export function LanguageToggle({ className }: Props) {
  const lang = useLangStore((s) => s.lang);
  const toggle = useLangStore((s) => s.toggle);
  const t = useT();
  const isEs = lang === 'es';
  const label = isEs ? t('Switch to English') : t('Switch to Spanish');

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-10 items-center gap-1.5 rounded-lg border-2 border-fg bg-surface px-2.5 text-fg shadow-brut-sm',
        'transition-transform duration-150 hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-0 active:translate-y-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
        className,
      )}
    >
      <Flag
        code={isEs ? 'ar' : 'us'}
        alt={isEs ? 'Español' : 'English'}
        className="h-3.5 w-5 rounded-[2px] border border-fg/40"
      />
      <span className="font-display text-xs font-bold tracking-tight">{isEs ? 'ES' : 'EN'}</span>
    </button>
  );
}
