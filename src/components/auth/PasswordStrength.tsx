import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { passwordStrength } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Props {
  password: string;
}

const COLOR_BY_LEVEL: Record<number, string> = {
  0: 'bg-fg/20',
  1: 'bg-accent-rose',
  2: 'bg-accent-amber',
  3: 'bg-accent-blue',
  4: 'bg-accent-emerald',
};

const LABEL_COLOR: Record<number, string> = {
  0: 'text-fg-muted',
  1: 'text-accent-rose',
  2: 'text-accent-amber',
  3: 'text-accent-blue',
  4: 'text-accent-emerald',
};

export function PasswordStrength({ password }: Props) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const strength = passwordStrength(password);

  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      const filled = i < strength.score;
      gsap.to(el, {
        scaleX: filled ? 1 : 0,
        duration: 0.3,
        ease: 'power3.out',
      });
    });
  }, [strength.score]);

  return (
    <div className="mt-2">
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((i) => {
          const filled = i < strength.score;
          const level = filled ? strength.score : 0;
          return (
            <div
              key={i}
              className="h-1.5 overflow-hidden rounded-sm border-2 border-fg bg-surface-2"
            >
              <div
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className={cn('h-full origin-left will-change-transform', COLOR_BY_LEVEL[level])}
                style={{ transform: 'scaleX(0)' }}
              />
            </div>
          );
        })}
      </div>
      <p
        className={cn(
          'mt-1.5 text-xs font-bold uppercase tracking-wider font-mono',
          LABEL_COLOR[strength.score],
        )}
        aria-live="polite"
      >
        {password ? strength.label : 'Enter a password'}
      </p>
    </div>
  );
}
