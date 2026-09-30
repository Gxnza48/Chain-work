// Adapted from the official 000h / Cojeev registry; see SOURCES.md.
"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { cardVariants } from "./card";
import { useMorph } from "@/lib/cojeev-motion/use-morph";
import { AnimatePresence, motion } from "motion/react";
import {
  motionTokens,
  useChoreography,
} from "@/lib/cojeev-motion/choreography";
import { useMotionVisibility } from "@/lib/cojeev-motion/use-motion-visibility";
import { assignMotionRef } from "@/lib/cojeev-motion/refs";

const SkeletonVariants = cva(
  "v-skel [border-radius:var(--r-pill)] [background:var(--v-skel-face)] [background-size:200%_100%] [animation:v-shimmer_1.4s_linear_infinite] [box-shadow:none] [position:relative] [overflow:hidden]",
  {
    variants: {
      variant: {
        default: "",
        pill: "-pill [border-radius:var(--r-pill)]",
        card: "-card [border-radius:var(--r-card)]",
        disk: "-disk [border-radius:50%]",
        line: "-line [height:12px] [border-radius:var(--r-pill)]",
        "skel-group": "-skel-group",
      },
      size: { default: "" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
export type SkeletonEffect = "shimmer" | "pulse" | "ink";
export type SkeletonProps = React.ComponentProps<"div"> &
  VariantProps<typeof SkeletonVariants> & {
    as?: React.ElementType;
    effect?: SkeletonEffect;
    paused?: boolean;
  };
export function Skeleton({
  as: Tag = "div",
  className,
  variant,
  size,
  ref,
  children,
  effect = "shimmer",
  paused = false,
  ...props
}: SkeletonProps) {
  const host = React.useRef<HTMLDivElement>(null);
  const attach = React.useCallback(
    (element: HTMLDivElement | null) => {
      host.current = element;
      const release = assignMotionRef(ref, element);
      return () => {
        host.current = null;
        release();
      };
    },
    [ref],
  );
  const ownedRef = useMorph<HTMLDivElement>("skeleton", attach);
  const { enabled, inView } = useMotionVisibility(host);
  const active =
    enabled &&
    inView &&
    !paused &&
    !className?.split(/\s+/).includes("-paused");
  const sweeping = effect === "shimmer";
  return (
    <Tag
      ref={ownedRef}
      data-slot="skeleton-item"
      data-part="item"
      data-effect={effect}
      data-paused={paused || undefined}
      data-motion={!active ? "off" : undefined}
      data-morph={effect === "ink" ? "stroke" : undefined}
      data-animated={active || undefined}
      className={cn(SkeletonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
      <motion.span
        aria-hidden="true"
        className="v-skel__sheen"
        initial={false}
        animate={{
          x: active && sweeping ? ["-100%", "100%"] : "0%",
          opacity: active ? (sweeping ? 1 : [0.12, 0.5, 0.12]) : 0.18,
        }}
        transition={
          active
            ? {
                x: { duration: 2.4, repeat: Infinity, ease: [0.4, 0, 0.2, 1] },
                opacity: sweeping
                  ? { duration: 0 }
                  : {
                      duration: effect === "ink" ? 3.2 : 1.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
              }
            : { duration: 0 }
        }
      />
    </Tag>
  );
}

const SkeletonGroupVariants = cva("v-skel-group [gap:var(--s-2)] [display:grid]", {
  variants: { variant: { default: "" }, size: { default: "" } },
  defaultVariants: { variant: "default", size: "default" },
});
export type SkeletonGroupProps = React.ComponentProps<"div"> &
  VariantProps<typeof SkeletonGroupVariants> & { as?: React.ElementType };
export function SkeletonGroup({
  as: Tag = "div",
  className,
  variant,
  size,
  ...props
}: SkeletonGroupProps) {
  return (
    <Tag
      data-slot="skeleton"
      data-part="root"
      className={cn(
        className?.split(/\s+/).includes("v-card") && cardVariants(),
        SkeletonGroupVariants({ variant, size }),
        className,
      )}
      {...props}
    />
  );
}

const AsyncContentVariants = cva(
  "v-async [display:grid] [gap:var(--s-3)] [padding:var(--s-5)] [border-radius:var(--r-card-sm)] [background:var(--v-beige)] [justify-items:start]",
  {
    variants: { variant: { default: "" }, size: { default: "" } },
    defaultVariants: { variant: "default", size: "default" },
  },
);
export type AsyncContentProps = React.ComponentProps<"div"> &
  VariantProps<typeof AsyncContentVariants> & {
    as?: React.ElementType;
    /** Caller-owned loading state. Omit to preserve the static composition. */
    loading?: boolean;
    fallback?: React.ReactNode;
  };
export function AsyncContent({
  loading,
  fallback,
  ...props
}: AsyncContentProps) {
  if (loading !== undefined)
    return <LoadingContent {...props} loading={loading} fallback={fallback} />;
  const { as: Tag = "div", className, variant, size, ...rest } = props;
  return (
    <Tag
      data-slot="skeleton-async"
      data-part="async"
      className={cn(AsyncContentVariants({ variant, size }), className)}
      {...rest}
    />
  );
}
function LoadingContent({
  as: Tag = "div",
  className,
  variant,
  size,
  ref,
  children,
  loading,
  fallback,
  ...props
}: AsyncContentProps & { loading: boolean }) {
  const host = React.useRef<HTMLDivElement>(null);
  const attach = React.useCallback(
    (node: HTMLDivElement | null) => {
      host.current = node;
      const release = assignMotionRef(ref, node);
      return () => {
        host.current = null;
        release();
      };
    },
    [ref],
  );
  const { enabled, inView } = useMotionVisibility(host);
  const { quiet } = useChoreography();
  const still = quiet || !enabled || !inView;
  const transition = {
    duration: still ? 0 : motionTokens.duration.enter,
    ease: [...motionTokens.ease.enter] as [number, number, number, number],
  };
  return (
    <Tag
      {...props}
      ref={attach}
      data-slot="skeleton-async"
      data-part="async"
      data-loading={loading}
      aria-busy={loading}
      className={cn(
        AsyncContentVariants({ variant, size }),
        "v-async--controlled",
        className,
      )}
    >
      <motion.div
        data-slot="skeleton-async-content"
        className="v-async__content"
        inert={loading || undefined}
        aria-hidden={loading || undefined}
        initial={false}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={transition}
      >
        {children}
      </motion.div>
      <AnimatePresence initial={false}>
        {loading && (
          <motion.div
            key="placeholder"
            data-slot="skeleton-async-fallback"
            className="v-async__fallback"
            aria-hidden="true"
            inert
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
          >
            {fallback ?? (
              <SkeletonGroup>
                <Skeleton variant="line" style={{ width: "92%" }} />
                <Skeleton variant="line" style={{ width: "72%" }} />
                <Skeleton variant="line" style={{ width: "54%" }} />
              </SkeletonGroup>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Tag>
  );
}

const AsyncRowVariants = cva(
  "v-async__row [display:flex] [align-items:center] [gap:var(--s-3)] [font-size:var(--fs-control)] [color:var(--v-text-2)]",
  {
    variants: { variant: { default: "" }, size: { default: "" } },
    defaultVariants: { variant: "default", size: "default" },
  },
);
export type AsyncRowProps = React.ComponentProps<"div"> &
  VariantProps<typeof AsyncRowVariants> & { as?: React.ElementType };
export function AsyncRow({
  as: Tag = "div",
  className,
  variant,
  size,
  ...props
}: AsyncRowProps) {
  return (
    <Tag
      data-slot="skeleton-async-row"
      data-part="async-row"
      className={cn(AsyncRowVariants({ variant, size }), className)}
      {...props}
    />
  );
}

const QuietVariants = cva("v-quiet [color:var(--v-text-2)]", {
  variants: { variant: { default: "" }, size: { default: "" } },
  defaultVariants: { variant: "default", size: "default" },
});
export type QuietProps = React.ComponentProps<"span"> &
  VariantProps<typeof QuietVariants> & { as?: React.ElementType };
export function Quiet({
  as: Tag = "span",
  className,
  variant,
  size,
  ...props
}: QuietProps) {
  return (
    <Tag
      data-slot="skeleton-quiet"
      data-part="quiet"
      className={cn(QuietVariants({ variant, size }), className)}
      {...props}
    />
  );
}
