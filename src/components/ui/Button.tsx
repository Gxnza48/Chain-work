import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Button as CojeevButton } from '@/components/cojeev/button';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap select-none',
    'rounded-md border font-medium tracking-normal',
    'transition-[background-color,color,border-color,box-shadow] duration-200 ease-out',
    'disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-fg text-bg border-transparent shadow-sm hover:bg-fg/90',
        secondary:
          'bg-surface-2 text-fg border-border hover:bg-fg/10',
        accent:
          'bg-fg text-bg border-transparent hover:bg-fg/90',
        danger:
          'bg-accent-rose/10 text-accent-rose border-accent-rose/20 hover:bg-accent-rose/20',
        ghost:
          'bg-transparent text-fg border-transparent hover:bg-surface-2 active:translate-x-0 active:translate-y-0',
        outline:
          'bg-transparent text-fg border-border hover:bg-surface active:translate-x-0 active:translate-y-0',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-sm',
        icon: 'h-10 w-10 p-0',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild, type, ...props }, ref) => {
    return (
      <CojeevButton ref={ref} asChild={asChild} shape="pill"
        type={type ?? 'submit'}
        data-cw-variant={variant ?? 'primary'}
        variant={variant === 'ghost' || variant === 'outline' || variant === 'danger' ? variant : 'default'}
        size={size === 'md' || !size ? 'default' : size}
        className={cn('cw-app-button', buttonVariants({ variant, size, block }), className)} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
