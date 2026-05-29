import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  to?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, to = '/', size = 'md' }: LogoProps) {
  const sizes = {
    sm: { wrap: 'gap-2 text-lg', mark: 'h-6 w-6' },
    md: { wrap: 'gap-2.5 text-xl', mark: 'h-7 w-7' },
    lg: { wrap: 'gap-3 text-2xl', mark: 'h-9 w-9' },
  } as const;
  const s = sizes[size];
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center font-display font-bold tracking-tight text-fg',
        s.wrap,
        className,
      )}
      aria-label="ChainWork"
    >
      <span
        aria-hidden
        className={cn(
          'inline-grid place-items-center rounded-md border-2 border-fg bg-accent-blue text-white shadow-brut-sm font-mono leading-none',
          s.mark,
        )}
      >
        <span className="text-xs font-bold">CW</span>
      </span>
      <span>ChainWork</span>
    </Link>
  );
}
