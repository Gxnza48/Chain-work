import { useEffect, useRef } from 'react';
import { getLenis } from '@/lib/lenis';

/**
 * Returns a ref you attach to a fixed-position bar (full-width, ~4px tall).
 * It updates `transform: scaleX(progress)` on scroll only — no perpetual rAF —
 * so the main thread stays idle when the user isn't scrolling. Transform-only,
 * never animates layout.
 */
export function useScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transformOrigin = 'left center';
    el.style.willChange = 'transform';

    function compute(): number {
      const lenis = getLenis();
      const p = (lenis as unknown as { progress?: number } | null)?.progress;
      if (typeof p === 'number' && Number.isFinite(p)) return Math.min(1, Math.max(0, p));
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      return Math.min(1, Math.max(0, window.scrollY / max));
    }

    let ticking = false;
    function update() {
      if (!el) return;
      el.style.transform = `scaleX(${compute()})`;
      ticking = false;
    }
    function onScroll() {
      // coalesce bursts of scroll events into one write per frame
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const lenis = getLenis();
    lenis?.on?.('scroll', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      lenis?.off?.('scroll', onScroll);
    };
  }, []);

  return ref;
}
