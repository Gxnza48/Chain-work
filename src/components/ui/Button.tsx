import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap select-none',
    'rounded-lg border-2 font-display font-bold tracking-tight',
    'transition-[transform,box-shadow,background-color,color] duration-150 ease-out',
    'disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    'active:translate-x-[2px] active:translate-y-[2px]',
    'will-change-transform',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-accent-blue text-white border-fg shadow-brut hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brut-lg active:shadow-brut-sm',
        secondary:
          'bg-surface text-fg border-fg shadow-brut hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brut-lg active:shadow-brut-sm',
        accent:
          'bg-accent-violet text-white border-fg shadow-brut hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brut-lg active:shadow-brut-sm',
        danger:
          'bg-accent-rose text-white border-fg shadow-brut hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-brut-lg active:shadow-brut-sm',
        ghost:
          'bg-transparent text-fg border-transparent hover:bg-surface-2 active:translate-x-0 active:translate-y-0',
        outline:
          'bg-transparent text-fg border-fg hover:bg-surface active:translate-x-0 active:translate-y-0',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-5 text-base',
        lg: 'h-14 px-7 text-lg',
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
  ({ className, variant, size, block, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size, block }), className)} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
