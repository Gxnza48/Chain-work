import { useEffect, useState } from 'react';

let listeners = 0;
let interval: number | null = null;
const subscribers = new Set<() => void>();

function ensureRunning() {
  if (interval !== null) return;
  interval = window.setInterval(() => {
    subscribers.forEach((cb) => cb());
  }, 60_000);
}

function stopIfIdle() {
  if (listeners === 0 && interval !== null) {
    window.clearInterval(interval);
    interval = null;
  }
}

/** Single shared 60s tick that re-renders any subscriber for relative-time labels. */
export function useRelativeTimeTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    listeners += 1;
    const cb = () => setTick((t) => t + 1);
    subscribers.add(cb);
    ensureRunning();
    return () => {
      subscribers.delete(cb);
      listeners -= 1;
      stopIfIdle();
    };
  }, []);
  return tick;
}
