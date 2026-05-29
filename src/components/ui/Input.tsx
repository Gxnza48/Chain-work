import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-lg border-2 bg-surface-2 px-3 py-2 text-base font-medium',
        'text-fg placeholder:text-fg-muted',
        'transition-[box-shadow,border-color] duration-150 ease-out',
        'focus:outline-none focus:border-accent-blue focus:shadow-brut-blue',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-accent-rose' : 'border-fg',
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';
