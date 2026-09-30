import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Badge as CojeevBadge } from '@/components/cojeev/badge';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        neutral: 'bg-surface-2 text-fg border-border',
        blue: 'bg-accent-blue text-white border-border',
        violet: 'bg-accent-violet text-white border-border',
        emerald: 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20',
        amber: 'bg-accent-amber/10 text-accent-amber border-accent-amber/20',
        rose: 'bg-accent-rose/10 text-accent-rose border-accent-rose/20',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, ...props }, ref) => (
  <CojeevBadge ref={ref} className={cn('cw-app-badge', badgeVariants({ variant }), className)} {...props} />
));
Badge.displayName = 'Badge';
