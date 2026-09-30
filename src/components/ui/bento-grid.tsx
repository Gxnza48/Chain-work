"use client";
import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  bentoTilePath,
  validateBento,
  type BentoLayout,
  type BentoTile,
  type BentoVariant,
} from "@/lib/cojeev/bento-layout";
import { useMotionVisibility } from "@/lib/cojeev-motion/use-motion-visibility";
import { assignMotionRef } from "@/lib/cojeev-motion/refs";
export type {
  BentoLayout,
  BentoTile,
  BentoVariant,
} from "@/lib/cojeev/bento-layout";
export type BentoGridProps = React.ComponentProps<"div"> & {
  layout: BentoLayout;
  variant: BentoVariant;
  renderTile?: (tile: BentoTile) => React.ReactNode;
};
export function BentoGrid({
  layout,
  variant = "classic",
  renderTile,
  className,
  style,
  ref,
  ...props
}: BentoGridProps) {
  const host = React.useRef<HTMLDivElement>(null),
    { enabled, inView } = useMotionVisibility(host);
  const attach = React.useCallback(
    (node: HTMLDivElement | null) => {
      host.current = node;
      const cleanup = assignMotionRef(ref, node);
      return () => {
        host.current = null;
        cleanup();
      };
    },
    [ref],
  );
  const geometry = layout.tiles
    .map((t) => `${t.x},${t.y},${t.width},${t.height}`)
    .join(";");
  const error = validateBento(layout);
  if (error)
    return (
      <div
        {...props}
        ref={attach}
        role="alert"
        className={className}
        style={style}
      >
        {error}
      </div>
    );
  return (
    <div
      {...props}
      ref={attach}
      data-slot="bento-grid"
      data-variant={variant}
      className={cn("v-bento", className)}
      style={
        {
          "--bento-columns": layout.columns,
          "--bento-rows": layout.rows,
          ...style,
        } as React.CSSProperties
      }
    >
      {variant === "interlock" && (
        <svg
          className="v-bento__paint"
          viewBox={`0 0 ${layout.columns} ${layout.rows}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <g key={geometry}>
            {layout.tiles.map((tile, i) => (
              <motion.path
                key={`${tile.x},${tile.y}`}
                className={`v-bento__color-${i % 6}`}
                initial={false}
                animate={{ d: bentoTilePath(tile, layout) }}
                transition={{ duration: enabled && inView ? 0.3 : 0 }}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        </svg>
      )}
      {layout.tiles.map((tile, i) => (
        <div
          key={tile.id}
          data-bento-tile={tile.id}
          className={`v-bento__tile v-bento__color-${i % 6}`}
          style={{
            gridColumn: `${tile.x + 1} / span ${tile.width}`,
            gridRow: `${tile.y + 1} / span ${tile.height}`,
          }}
        >
          {renderTile ? (
            renderTile(tile)
          ) : (
            <>
              <span className="v-bento__number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="v-bento__label">{tile.label}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
