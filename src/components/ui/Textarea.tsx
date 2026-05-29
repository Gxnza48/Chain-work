import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[88px] w-full rounded-lg border-2 bg-surface-2 px-3 py-2 text-base font-medium',
          'text-fg placeholder:text-fg-muted resize-y',
          'transition-[box-shadow,border-color] duration-150 ease-out',
          'focus:outline-none focus:border-accent-blue focus:shadow-brut-blue',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-accent-rose' : 'border-fg',
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';
