import { Toaster as Sonner } from 'sonner';
import { useTheme } from '@/hooks/useTheme';

export function Toaster() {
  const { theme } = useTheme();
  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      richColors={false}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            'rounded-lg border-2 border-fg bg-surface text-fg shadow-brut font-medium px-4 py-3 flex items-center gap-3',
          title: 'font-display font-bold tracking-tight text-fg',
          description: 'text-sm text-fg-muted',
          success: 'border-accent-emerald',
          error: 'border-accent-rose',
          warning: 'border-accent-amber',
          info: 'border-accent-blue',
          actionButton:
            'bg-accent-blue text-white border-2 border-fg rounded-md px-3 py-1 font-bold text-xs shadow-brut-sm',
          cancelButton:
            'bg-surface-2 text-fg border-2 border-fg rounded-md px-3 py-1 font-bold text-xs',
        },
      }}
    />
  );
}
