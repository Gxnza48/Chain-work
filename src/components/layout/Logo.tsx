import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  to?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, to = '/', size = 'md' }: LogoProps) {
  const sizes = {
    sm: { wrap: 'gap-2 text-lg', mark: 'h-6 w-6', svg: 'h-4 w-4' },
    md: { wrap: 'gap-2.5 text-xl', mark: 'h-7 w-7', svg: 'h-[18px] w-[18px]' },
    lg: { wrap: 'gap-3 text-2xl', mark: 'h-9 w-9', svg: 'h-6 w-6' },
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
          'inline-grid place-items-center rounded-md border-2 border-fg bg-accent-blue text-white shadow-brut-sm',
          s.mark,
        )}
      >
        <ChainMark className={s.svg} />
      </span>
      <span>ChainWork</span>
    </Link>
  );
}

/**
 * Two diagonal interlocking chain links — the ChainWork brand mark.
 * `currentColor` so it inherits text color from the parent badge.
 */
export function ChainMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* top-left link */}
      <ellipse cx="8" cy="8" rx="5" ry="2.4" transform="rotate(-45 8 8)" />
      {/* bottom-right link */}
      <ellipse cx="16" cy="16" rx="5" ry="2.4" transform="rotate(-45 16 16)" />
    </svg>
  );
}
