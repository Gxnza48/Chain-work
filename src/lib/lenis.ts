import Lenis from '@studio-freight/lenis';
import { gsap, ScrollTrigger, registerGsap } from './gsap';
import { prefersReducedMotion } from './utils';

let lenis: Lenis | null = null;

export function getLenis(): Lenis | null {
  return lenis;
}

export function initLenis(): Lenis | null {
  if (typeof window === 'undefined') return null;
  if (lenis) return lenis;
  registerGsap();

  if (prefersReducedMotion()) {
    return null;
  }

  lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
  });

  // wire Lenis ↔ GSAP ticker / ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function destroyLenis(): void {
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
}
