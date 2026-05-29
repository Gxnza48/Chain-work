import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Shared "pop" reveal used across the landing: elements rise, scale up from
 * slightly small, and fade in with a springy settle. Built on Framer Motion's
 * IntersectionObserver-based `whileInView`, so it fires reliably regardless of
 * smooth-scroll (Lenis) and doesn't depend on ScrollTrigger.
 */
export const popVariants: Variants = {
  hidden: { opacity: 0, y: 48, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 240, damping: 20, mass: 0.7 },
  },
};

/** Container that staggers its `popVariants` children as the group scrolls in. */
export const staggerContainer = (stagger = 0.12): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: 0.05 } },
});

const VIEWPORT = { once: true, amount: 0.25 } as const;

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** A single element that pops in when scrolled into view. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <motion.div
      className={className}
      variants={popVariants}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      transition={{ type: 'spring', stiffness: 240, damping: 20, mass: 0.7, delay }}
    >
      {children}
    </motion.div>
  );
}

export { motion, VIEWPORT };
