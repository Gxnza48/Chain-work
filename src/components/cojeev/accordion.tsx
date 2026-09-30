// Adapted from 000h / Cojeev: https://000h.cojeev.com/r/accordion.json
// See SOURCES.md for the upstream source and ChainWork adaptations.
"use client";

import * as React from "react";
import { useChoreography } from "@/lib/cojeev-motion/choreography";
import { useDisclosureHeight } from "@/lib/cojeev-motion/use-disclosure-height";
import { useMorph } from "@/lib/cojeev-motion/use-morph";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Plus, ChevronDown } from "lucide-react";
import * as Primitive from "@radix-ui/react-accordion";
export const accordionVariants = cva("v-acc [display:grid] [gap:var(--s-2)]");
export type AccordionAppearance = "faq" | "chapters" | "editorial";
const AccordionAppearanceContext = React.createContext<
  AccordionAppearance | undefined
>(undefined);
export type AccordionProps = React.ComponentProps<typeof Primitive.Root> & {
  /** Optional structural treatment. Omit to preserve the original painted cards. */
  appearance?: AccordionAppearance;
};
export function Accordion({ className, appearance, ...props }: AccordionProps) {
  const { quiet } = useChoreography();
  return (
    <AccordionAppearanceContext.Provider value={appearance}>
      <Primitive.Root
        data-slot="accordion"
        data-part="root"
        data-appearance={appearance}
        data-motion-quiet={quiet || undefined}
        data-motion={quiet ? "off" : undefined}
        className={cn(accordionVariants(), className)}
        {...props}
      />
    </AccordionAppearanceContext.Provider>
  );
}
export type AccordionItemProps = React.ComponentProps<typeof Primitive.Item>;
export function AccordionItem({
  className,
  ref,
  ...props
}: AccordionItemProps) {
  const appearance = React.useContext(AccordionAppearanceContext);
  const morphRef = useMorph<HTMLDivElement>("cards", ref);
  return (
    <Primitive.Item
      ref={morphRef}
      data-slot="accordion-item"
      data-part="item"
      data-stable-hit=""
      data-morph={appearance ? "fill" : undefined}
      data-tier={appearance ? "card" : undefined}
      data-r={appearance === "chapters" ? "12" : appearance ? "18" : undefined}
      className={cn(
        "overflow-hidden rounded-[var(--r-card)] bg-[var(--card)]",
        className,
      )}
      {...props}
    />
  );
}
export type AccordionTriggerProps = React.ComponentProps<
  typeof Primitive.Trigger
> & { indicator?: React.ReactNode };
export function AccordionTrigger({
  className,
  children,
  indicator,
  ...props
}: AccordionTriggerProps) {
  return (
    <Primitive.Header className="contents">
      <Primitive.Trigger
        data-slot="accordion-trigger"
        data-part="trigger"
        className={cn(
          "flex w-full items-center text-left min-h-[60px] py-3 pl-3 pr-4 gap-3.5 rounded-[var(--r-card)] font-semibold text-[length:var(--fs-body)] leading-[1.3]",
          className,
        )}
        {...props}
      >
        {props.asChild ? (
          children
        ) : (
          <>
            {children}
            {indicator ?? <AccordionIndicator />}
          </>
        )}
      </Primitive.Trigger>
    </Primitive.Header>
  );
}
export type AccordionContentProps = React.ComponentProps<
  typeof Primitive.Content
>;
export function AccordionContent({
  className,
  ref,
  children,
  ...props
}: AccordionContentProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => contentRef.current!);
  useDisclosureHeight(contentRef, props.style?.animationName);
  return (
    <Primitive.Content
      ref={contentRef}
      data-slot="accordion-content"
      data-part="content"
      className={cn("v-acc__body", className)}
      {...props}
    >
      <div data-slot="accordion-content-inner" data-disclosure-inner>
        {children}
      </div>
    </Primitive.Content>
  );
}
export type AccordionIndicatorProps = React.ComponentProps<"svg">;
export function AccordionIndicator({
  className,
  ...props
}: AccordionIndicatorProps) {
  const appearance = React.useContext(AccordionAppearanceContext);
  const Indicator = appearance === "faq" ? Plus : ChevronDown;
  return (
    <Indicator
      data-slot="accordion-indicator"
      data-part="indicator"
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn("v-icon v-chev ml-auto", className)}
      {...props}
    />
  );
}
