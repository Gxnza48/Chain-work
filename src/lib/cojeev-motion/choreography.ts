import { useReducedMotion, type Transition } from 'framer-motion';

// 000h Presence adapter: use ChainWork's existing Motion runtime and the OS
// preference instead of importing the library's entire appearance engine.
export const motionTokens = {
  duration: { exit: .14 },
  ease: { exit: [.4, 0, 1, 1], settle: [.2, .65, .25, 1] },
} as const;
export function useChoreography(): { quiet: boolean; transition: Transition } {
  const quiet = Boolean(useReducedMotion());
  return { quiet, transition: quiet ? { duration: 0 } : { duration: .22, ease: [.2, .8, .2, 1] } };
}
