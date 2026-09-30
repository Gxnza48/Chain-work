import { forwardRef } from 'react';
import { Progress as CojeevProgress } from '@/components/cojeev/progress';
import { cn } from '@/lib/utils';
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  trackClassName?: string;
  barClassName?: string;
}
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, max = 100, className, trackClassName, barClassName, ...props }, ref) => (
    <CojeevProgress ref={ref} value={value} max={max} appearance="line"
      data-complete={barClassName?.includes('emerald') || undefined}
      className={cn('cw-app-progress relative h-2 w-full overflow-hidden rounded-full', trackClassName, className)} {...props} />
  ),
);
Progress.displayName = 'Progress';
