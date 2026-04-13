import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  PAGE_TRANSITION_ANIMATE,
  PAGE_TRANSITION_EXIT,
  PAGE_TRANSITION_INITIAL,
  PAGE_TRANSITION_TIMING,
} from '../../app/animations/pageTransitions';

interface PageTransitionWrapperProps {
  routeKey: string;
  children: ReactNode;
}

export function PageTransitionWrapper({ routeKey, children }: PageTransitionWrapperProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        initial={PAGE_TRANSITION_INITIAL}
        animate={PAGE_TRANSITION_ANIMATE}
        exit={PAGE_TRANSITION_EXIT}
        transition={PAGE_TRANSITION_TIMING}
        style={{ height: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
