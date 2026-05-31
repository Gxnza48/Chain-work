import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

interface ChainLoaderProps {
  size?: number;
  className?: string;
  label?: string;
  /** Center it in a full-height area (used for page-level loading screens). */
  fullscreen?: boolean;
}

/**
 * ChainWork's signature loader: two interlocking chain links that draw
 * themselves on, one after the other, then release and repeat. The first link
 * "forges", then the second locks into it — a tiny brand moment for any wait.
 */
export function ChainLoader({ size = 72, className, label, fullscreen }: ChainLoaderProps) {
  const t = useT();
  const loader = (
    <div
      className={cn('inline-flex flex-col items-center gap-4', className)}
      role="status"
      aria-label={label ?? t('Loading')}
    >
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
        <g
          transform="rotate(-45 32 32)"
          stroke="rgb(var(--fg))"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* first link — forges first */}
          <motion.rect
            x="7"
            y="22"
            width="31"
            height="20"
            rx="10"
            initial={{ pathLength: 0, opacity: 0.15 }}
            animate={{ pathLength: [0, 1, 1, 0], opacity: [0.15, 1, 1, 0.15] }}
            transition={{
              duration: 1.8,
              times: [0, 0.35, 0.82, 1],
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* second link — locks in after the first */}
          <motion.rect
            x="26"
            y="22"
            width="31"
            height="20"
            rx="10"
            stroke="rgb(var(--accent-blue))"
            initial={{ pathLength: 0, opacity: 0.15 }}
            animate={{ pathLength: [0, 0, 1, 1, 0], opacity: [0.15, 0.15, 1, 1, 0.15] }}
            transition={{
              duration: 1.8,
              times: [0, 0.3, 0.62, 0.86, 1],
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </g>
      </svg>
      {label ? (
        <motion.span
          className="font-display text-sm font-bold tracking-tight text-fg-muted"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          {label}
        </motion.span>
      ) : null}
    </div>
  );

  if (fullscreen) {
    return <div className="grid min-h-screen place-items-center bg-bg">{loader}</div>;
  }
  return loader;
}
