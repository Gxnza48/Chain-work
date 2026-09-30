import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as CojeevTabs from '@/components/cojeev/tabs';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Tabs = CojeevTabs.Tabs;

export const TabsList = forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <CojeevTabs.TabsList
    ref={ref}
    className={cn(
      'flex w-full flex-wrap items-center gap-1 rounded-lg bg-surface-2 p-1 sm:inline-flex sm:w-auto',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <CojeevTabs.TabsTrigger
    ref={ref}
    className={cn(
      'inline-flex min-w-0 flex-none whitespace-nowrap items-center justify-center rounded-md px-3 py-1.5 text-center sm:flex-none',
      'text-sm font-medium text-fg-muted',
      'transition-colors duration-150 ease-out',
      'data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:shadow-sm',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <CojeevTabs.TabsContent ref={ref} className={cn('mt-4 focus-visible:outline-none', className)} {...props} />
));
TabsContent.displayName = 'TabsContent';
