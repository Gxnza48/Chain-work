"use client";
import * as React from "react";
import { useReferenceRef } from "@/lib/cojeev/reference-ref";
import { cn } from "@/lib/utils";
import { bounded, scrollWordProgress } from "@/lib/cojeev/reference-text-math";
import {
  useReferenceText,
  type ReferenceTextSize,
} from "@/lib/cojeev/reference-text-motion";
export type ScrollRevealProps = Omit<
  React.ComponentProps<"div">,
  "children"
> & {
  text: string;
  /** Optional controlled 0–1 progress; omit for native scrolling. */ progress?: number;
  scrollTarget?: React.RefObject<HTMLElement | null>;
  blur?: number;
  rotation?: number;
  paused?: boolean;
  size?: ReferenceTextSize;
};
/** Native-scroll progress continuously resolves each word and levels the whole phrase. */
export function ScrollReveal({
  text,
  progress,
  scrollTarget,
  blur = 3,
  rotation = -3,
  paused = false,
  size = "default",
  className,
  ref,
  ...props
}: ScrollRevealProps) {
  const { host: hostRef, running } = useReferenceText(paused);
  React.useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let frame = 0;
    const paint = () => {
      const box = el.getBoundingClientRect(),
        root = scrollTarget?.current?.getBoundingClientRect();
      const height = root?.height ?? window.innerHeight,
        top = root?.top ?? 0;
      const p = running
        ? progress === undefined
          ? bounded((height * 0.9 - (box.top - top)) / (height * 0.65), 0, 1, 1)
          : bounded(progress, 0, 1, 1)
        : 1;
      el.style.setProperty(
        "--scroll-reveal-rotation",
        `${bounded(rotation, -12, 12, -3) * (1 - p)}deg`,
      );
      el.dataset.progress = p.toFixed(3);
      const words = el.querySelectorAll<HTMLElement>("[data-scroll-word]");
      words.forEach((word, i) => {
        const q = scrollWordProgress(p, i, words.length);
        word.style.opacity = String(0.28 + 0.72 * q);
        word.style.filter = `blur(${bounded(blur, 0, 8, 3) * (1 - q)}px)`;
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    };
    paint();
    if (!running || progress !== undefined) return;
    const target = scrollTarget?.current ?? window;
    target.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [hostRef, running, progress, scrollTarget, blur, rotation, text]);
  return (
    <div
      {...props}
      ref={useReferenceRef(hostRef, ref)}
      data-slot="scroll-reveal"
      data-size={size}
      data-running={running}
      className={cn("v-scroll-reveal", className)}
    >
      <span className="v-scroll-reveal__accessible">{text}</span>
      <span aria-hidden="true" className="v-scroll-reveal__words">
        {text.split(/(\s+)/).map((word, i) =>
          /^\s+$/.test(word) ? (
            word
          ) : (
            <span key={i} data-scroll-word="">
              {word}
            </span>
          ),
        )}
      </span>
    </div>
  );
}
