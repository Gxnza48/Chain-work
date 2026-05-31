import { cn } from '@/lib/utils';

interface FlagProps {
  /** ISO 3166-1 alpha-2 country code, lowercase (e.g. "ar", "us"). */
  code: string;
  alt?: string;
  className?: string;
}

/**
 * Country flag rendered from the flagcdn image API instead of emoji — emoji
 * flags don't render on Windows/most desktop browsers, so we use real images.
 */
export function Flag({ code, alt = '', className }: FlagProps) {
  const c = code.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/w40/${c}.png`}
      srcSet={`https://flagcdn.com/w80/${c}.png 2x`}
      width={20}
      alt={alt}
      className={cn('inline-block h-auto select-none object-cover', className)}
      loading="lazy"
      draggable={false}
    />
  );
}
