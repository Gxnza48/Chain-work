import { forwardRef } from 'react';
import { Input as CojeevInput } from '@/components/cojeev/input';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, size, ...props }, ref) => {
  return (
    <CojeevInput
      ref={ref}
      nativeSize={size}
      aria-invalid={error || props['aria-invalid']}
      className={cn(
        'cw-app-input flex h-11 w-full rounded-lg border bg-surface-2 px-3 py-2 text-base font-medium',
        'text-fg placeholder:text-fg-muted',
        'transition-[box-shadow,border-color] duration-150 ease-out',
        'focus:outline-none focus:border-accent-blue focus:shadow-soft',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-accent-rose' : 'border-border',
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';
