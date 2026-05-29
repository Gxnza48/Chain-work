import Lenis from '@studio-freight/lenis';
import { gsap, ScrollTrigger, registerGsap } from './gsap';

let lenis: Lenis | null = null;
let rafCallback: ((time: number) => void) | null = null;

export function getLenis(): Lenis | null {
  return lenis;
}

export function initLenis(): Lenis | null {
  if (typeof window === 'undefined') return null;
  if (lenis) return lenis;

  try {
    registerGsap();

    lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });

    // wire Lenis ↔ GSAP ticker / ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    rafCallback = (time: number) => {
      lenis?.raf(time * 1000);
    };
    gsap.ticker.add(rafCallback);
    gsap.ticker.lagSmoothing(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[lenis] init failed:', err);
    lenis = null;
  }

  return lenis;
}

export function destroyLenis(): void {
  if (rafCallback) {
    gsap.ticker.remove(rafCallback);
    rafCallback = null;
  }
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
}
