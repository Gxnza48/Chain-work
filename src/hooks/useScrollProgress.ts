import { useEffect, useRef } from 'react';
import { getLenis } from '@/lib/lenis';

/**
 * Returns a ref you attach to a fixed-position bar (full-width, ~4px tall).
 * It updates its `transform: scaleX(progress)` from Lenis progress on every frame.
 * Transform-only — never animates layout.
 */
export function useScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transformOrigin = 'left center';
    el.style.willChange = 'transform';

    const lenis = getLenis();

    let raf = 0;

    function compute(): number {
      if (lenis) {
        // Lenis exposes .progress (0..1) on supported versions; fallback to window calc
        const p = (lenis as unknown as { progress?: number }).progress;
        if (typeof p === 'number' && Number.isFinite(p)) return Math.min(1, Math.max(0, p));
      }
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      return Math.min(1, Math.max(0, window.scrollY / max));
    }

    function tick() {
      if (!el) return;
      el.style.transform = `scaleX(${compute()})`;
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);

  return ref;
}
