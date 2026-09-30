import { vi } from 'vitest';

/** jsdom lacks the browser APIs used by real Cojeev controls. */
export function installMotionEnvironment() {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
    matches: query.includes('prefers-reduced-motion'), media: query,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
  })));
  Object.defineProperty(document, 'fonts', { configurable: true, value: {
    ready: Promise.resolve(), addEventListener() {}, removeEventListener() {},
  } });
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} });
}
