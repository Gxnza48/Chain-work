import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  trackClassName?: string;
  barClassName?: string;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, max = 100, className, trackClassName, barClassName, ...props }, ref) => {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return (
      <div
        ref={ref}
        className={cn('h-2 w-full overflow-hidden rounded-md border-2 border-fg bg-surface-2', trackClassName, className)}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        {...props}
      >
        <div
          className={cn('h-full bg-accent-blue transition-transform duration-300 ease-out origin-left', barClassName)}
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>
    );
  },
);
Progress.displayName = 'Progress';
