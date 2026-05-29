import { useEffect, useRef } from 'react';
import { Moon, Sun } from 'lucide-react';
import { gsap } from '@/lib/gsap';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
}

export function ThemeToggle({ className }: Props) {
  const { theme, toggle } = useTheme();
  const sunRef = useRef<SVGSVGElement | null>(null);
  const moonRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!sunRef.current || !moonRef.current) return;
    const dark = theme === 'dark';
    gsap.to(sunRef.current, {
      opacity: dark ? 0 : 1,
      rotate: dark ? -90 : 0,
      scale: dark ? 0.4 : 1,
      duration: 0.35,
      ease: 'power3.out',
    });
    gsap.to(moonRef.current, {
      opacity: dark ? 1 : 0,
      rotate: dark ? 0 : 90,
      scale: dark ? 1 : 0.4,
      duration: 0.35,
      ease: 'power3.out',
    });
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      className={cn(
        'relative inline-grid h-10 w-10 place-items-center rounded-lg border-2 border-fg bg-surface text-fg shadow-brut-sm',
        'transition-transform duration-150 hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-0 active:translate-y-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
        className,
      )}
    >
      <Sun ref={sunRef} className="absolute h-5 w-5" strokeWidth={2.4} />
      <Moon ref={moonRef} className="absolute h-5 w-5" strokeWidth={2.4} />
    </button>
  );
}
