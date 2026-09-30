import { Skeleton as CojeevSkeleton } from '@/components/cojeev/skeleton';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <CojeevSkeleton effect="shimmer" className={cn('cw-app-skeleton', className)} {...props} />;
}
