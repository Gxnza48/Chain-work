"use client";

import * as React from "react";
import { useMorph } from "@/lib/cojeev-motion/use-morph";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import * as Primitive from "@radix-ui/react-popover";
import { useFlowAppearance } from "@/lib/cojeev-motion/use-flow";
export type PopoverProps = React.ComponentProps<typeof Primitive.Root>;
export function Popover(props: PopoverProps) {
  return <Primitive.Root {...props} />;
}
export type PopoverTriggerProps = React.ComponentProps<
  typeof Primitive.Trigger
>;
export function PopoverTrigger(props: PopoverTriggerProps) {
  return (
    <Primitive.Trigger
      data-slot="popover-trigger"
      data-part="trigger"
      {...props}
    />
  );
}
export type PopoverPortalProps = React.ComponentProps<typeof Primitive.Portal>;
export function PopoverPortal(props: PopoverPortalProps) {
  return <Primitive.Portal {...props} />;
}
export type PopoverAnchorProps = React.ComponentProps<typeof Primitive.Anchor>;
export function PopoverAnchor(props: PopoverAnchorProps) {
  return (
    <Primitive.Anchor
      data-slot="popover-anchor"
      data-part="anchor"
      {...props}
    />
  );
}
export type PopoverCloseProps = React.ComponentProps<typeof Primitive.Close>;
export function PopoverClose(props: PopoverCloseProps) {
  return (
    <Primitive.Close data-slot="popover-close" data-part="close" {...props} />
  );
}
export const popoverContentVariants = cva(
  "v-popover [z-index:var(--z-popover)] [background:var(--popover)] [border-radius:var(--r-card)] [padding:var(--s-5)] [box-shadow:var(--shadow-float)] [border:1px_solid_var(--v-border)]",
);
export type PopoverContentProps = React.ComponentProps<
  typeof Primitive.Content
> & { portal?: boolean };
export function PopoverContent({
  className,
  ref,
  children,
  sideOffset = 6,
  align = "start",
  portal = true,
  ...props
}: PopoverContentProps) {
  const morphRef = useMorph<HTMLDivElement>("surfaces", ref);
  const flowRef = useFlowAppearance<HTMLDivElement>(true, morphRef, "grow");
  const content = (
    <Primitive.Content
      ref={flowRef}
      data-slot="popover-content"
      data-part="content"
      sideOffset={sideOffset}
      align={align}
      className={cn(popoverContentVariants(), className)}
      {...props}
    >
      {children}
    </Primitive.Content>
  );
  return portal ? <Primitive.Portal>{content}</Primitive.Portal> : content;
}
