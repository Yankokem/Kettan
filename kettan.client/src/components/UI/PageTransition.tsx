import type { ReactNode } from 'react';
import { motion } from 'motion/react';

interface PageTransitionProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
}

export function PageTransition({
  children,
  delay = 0,
  duration = 0.34,
  yOffset = 12,
}: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  );
}

interface SectionRevealProps {
  children: ReactNode;
  delay?: number;
}

export function SectionReveal({ children, delay = 0 }: SectionRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay }}
    >
      {children}
    </motion.div>
  );
}
