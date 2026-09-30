// Adapted from the official 000h / Cojeev registry; see SOURCES.md.
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { mixNumber, numberParts, rollingTarget } from "@/lib/cojeev/number-motion";
import { createMotionLane, motionTokens } from "@/lib/cojeev-motion/choreography";
import { getServerSettingsSnapshot, getSettingsSnapshot, subscribeSettings } from "@/lib/cojeev-motion/settings";
import { useMotionVisibility } from "@/lib/cojeev-motion/use-motion-visibility";

export type AnimatedNumberProps = Omit<React.ComponentProps<"span">, "children"> & {
  value: number;
  locale?: string;
  format?: Intl.NumberFormatOptions;
  /** Transition time in milliseconds, bounded to 0–2000 and scaled by Flow speed. */
  duration?: number;
  /** Count through values, roll each digit, or count in twelve drawn poses. */
  treatment?: "count" | "roll" | "steps";
  /** Optional starting value for the first visible entrance. SSR always shows the final value. */
  from?: number;
  /** Text for NaN or infinite values; never presents missing data as zero. */
  fallback?: string;
};

type Lane = ReturnType<typeof createMotionLane>;
type Wheel = { element: HTMLSpanElement; lane: Lane; reveal: Lane };

function makeNumberPainter(element: HTMLSpanElement, initial: number | null) {
  let current = initial, target = initial, signature = "", mode = "", formatter = new Intl.NumberFormat("en-US");
  const wheels = new Map<string, Wheel>();
  const resetWheels = () => { wheels.forEach(wheel => { wheel.lane.dispose(); wheel.reveal.dispose(); }); wheels.clear(); };
  let countLane: Lane | null = null;
  const clear = () => { countLane?.dispose(); countLane = null; resetWheels(); element.replaceChildren(); };
  return {
    update(value: number | null, options: { formatter: Intl.NumberFormat; signature: string; treatment: string; duration: number; still: boolean; fallback: string; start?: number }) {
      const changed = signature !== options.signature || mode !== options.treatment;
      if (changed) { clear(); signature = options.signature; mode = options.treatment; }
      formatter = options.formatter;
      if (value === null) { clear(); current = target = null; element.textContent = options.fallback; return; }
      if (options.start !== undefined) { current = options.start; target = options.start; resetWheels(); }
      const start = current ?? value;
      const previousTarget = target ?? start;
      target = value;
      const still = options.still || options.duration === 0;
      const transition = { duration: options.duration / 1000, ease: motionTokens.ease.settle };
      if (mode === "roll") {
        countLane?.dispose(); countLane = null;
        const parts = numberParts(formatter, value);
        const previousParts = new Map(numberParts(formatter, start).map(part => [part.key, part]));
        const keep = new Set(parts.map(part => part.key));
        for (const [key, wheel] of wheels) if (!keep.has(key)) { wheel.lane.dispose(); wheel.reveal.dispose(); wheel.element.remove(); wheels.delete(key); }
        const fragment = document.createDocumentFragment();
        let run: HTMLElement | null = null;
        for (const part of parts) {
          const numeric = /^(integer|fraction|decimal|group):/.test(part.key);
          if (numeric && !run) { run = document.createElement("bdi"); run.dir = "ltr"; run.className = "v-animated-number__run"; fragment.append(run); }
          if (!numeric) run = null;
          const parent = run ?? fragment;
          if (part.digit === undefined || !part.glyphs) { const literal = document.createElement("span"); literal.textContent = part.text; parent.append(literal); continue; }
          let wheel = wheels.get(part.key);
          if (!wheel) {
            const cell = document.createElement("span"); cell.className = "v-animated-number__digit";
            const track = document.createElement("span"); track.className = "v-animated-number__track";
            const first = document.createElement("span"), second = document.createElement("span"); track.append(first, second); cell.append(track);
            const glyphs = part.glyphs;
            const paint = (position: number) => { const integer = Math.floor(position), fraction = position - integer; first.textContent = glyphs[((integer % 10) + 10) % 10]; second.textContent = glyphs[(((integer + 1) % 10) + 10) % 10]; track.style.translate = `0 ${-fraction * 50}%`; };
            const previous = previousParts.get(part.key)?.digit;
            const origin = still ? part.digit : previous ?? 0;
            const lane = createMotionLane(origin, paint); paint(origin);
            const paintReveal = (amount: number) => { cell.style.opacity = String(amount); cell.style.translate = `0 ${(1 - amount) * .2}em`; };
            const revealed = still || previous !== undefined ? 1 : 0;
            const reveal = createMotionLane(revealed, paintReveal); paintReveal(revealed);
            wheel = { element: cell, lane, reveal }; wheels.set(part.key, wheel);
          }
          parent.append(wheel.element);
          if (still) { wheel.lane.jump(part.digit); wheel.reveal.jump(1); }
          else {
            const destination = rollingTarget(wheel.lane.get(), part.digit, Math.sign(value - previousTarget) || 1);
            if (Math.abs(destination - wheel.lane.get()) > 1e-7) wheel.lane.to(destination, transition);
            wheel.reveal.to(1, transition);
          }
        }
        element.replaceChildren(fragment);
        current = value;
        return;
      }
      resetWheels();
      countLane?.dispose();
      if (still || start === value) { current = value; element.textContent = formatter.format(value); return; }
      let pose = -1;
      const paint = (progress: number) => {
        const nextPose = Math.min(12, Math.floor(progress * 12));
        if (mode === "steps" && nextPose === pose) return;
        pose = nextPose;
        const amount = mode === "steps" ? nextPose / 12 : progress;
        current = mixNumber(start, value, amount);
        const text = formatter.format(current);
        if (mode !== "steps" || amount === 1) { element.textContent = text; return; }
        const fragment = document.createDocumentFragment();
        Array.from(text).forEach((character, index) => { const glyph = document.createElement("span"); glyph.textContent = character; glyph.className = "v-animated-number__pose"; glyph.style.rotate = `${Math.sin((pose + 1) * 2.7 + index * 1.9) * 1.8}deg`; glyph.style.translate = `0 ${Math.cos(pose * 1.7 + index) * .025}em`; fragment.append(glyph); });
        element.replaceChildren(fragment);
      };
      countLane = createMotionLane(0, paint); paint(0);
      countLane.to(1, transition, () => { current = value; element.textContent = formatter.format(value); });
    },
    dispose() { clear(); },
  };
}

/** Locale-aware numbers with a final accessible value and interruptible visual motion. */
export function AnimatedNumber({ value, locale = "en-US", format, duration = 500, treatment = "count", from, fallback = "—", className, ref, ...props }: AnimatedNumberProps) {
  const host = React.useRef<HTMLSpanElement>(null), visual = React.useRef<HTMLSpanElement>(null);
  const painter = React.useRef<ReturnType<typeof makeNumberPainter> | null>(null);
  const entered = React.useRef(false);
  const safeValue = Number.isFinite(value) ? value : null;
  const formatKey = JSON.stringify(format ?? {});
  const formatter = React.useMemo(() => new Intl.NumberFormat(locale, JSON.parse(formatKey)), [locale, formatKey]);
  const formatted = safeValue === null ? fallback : formatter.format(safeValue);
  const [initial] = React.useState(formatted);
  const { enabled, inView } = useMotionVisibility(host);
  const settings = React.useSyncExternalStore(subscribeSettings, getSettingsSnapshot, getServerSettingsSnapshot);
  const [localQuiet, setLocalQuiet] = React.useState(false);
  const still = !enabled || !inView || localQuiet;
  const ownedRef = React.useCallback((node: HTMLSpanElement | null) => { host.current = node; if (typeof ref === "function") return ref(node); if (ref) ref.current = node; }, [ref]);
  React.useLayoutEffect(() => {
    const element = visual.current;
    if (!element) return;
    const instance = makeNumberPainter(element, safeValue); painter.current = instance;
    return () => { instance.dispose(); painter.current = null; };
  // The painter owns its visual DOM and receives all changing props below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    const element = host.current; if (!element) return;
    const update = () => setLocalQuiet(Boolean(element.closest('[data-flow="off"],[data-no-glide]')));
    const observer = new MutationObserver(update);
    for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) observer.observe(ancestor, { attributes: true, attributeFilter: ["data-flow", "data-no-glide"] });
    update(); return () => observer.disconnect();
  }, []);
  React.useLayoutEffect(() => {
    const entrance = !entered.current && enabled && inView && !localQuiet;
    if (inView && enabled) entered.current = true;
    painter.current?.update(safeValue, { formatter, signature: `${locale}:${formatKey}`, treatment, duration: (Number.isFinite(duration) ? Math.min(2000, Math.max(0, duration)) : 500) / settings.flow.speed, still, fallback, start: entrance && Number.isFinite(from) ? from : undefined });
  }, [safeValue, formatter, formatKey, locale, treatment, duration, still, fallback, from, enabled, inView, localQuiet, settings.flow.speed]);
  return <span {...props} ref={ownedRef} data-slot="animated-number" data-treatment={treatment} data-quiet={still} className={cn("v-animated-number", className)}>
    <span className="v-animated-number__accessible">{formatted}</span>
    <span ref={visual} className="v-animated-number__visual" aria-hidden="true">{initial}</span>
  </span>;
}
