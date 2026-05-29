import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-wide font-mono',
  {
    variants: {
      variant: {
        neutral: 'bg-surface-2 text-fg border-fg',
        blue: 'bg-accent-blue text-white border-fg',
        violet: 'bg-accent-violet text-white border-fg',
        emerald: 'bg-accent-emerald text-white border-fg',
        amber: 'bg-accent-amber text-white border-fg',
        rose: 'bg-accent-rose text-white border-fg',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, ...props }, ref) => (
  <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
));
Badge.displayName = 'Badge';
