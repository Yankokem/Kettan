export const PAGE_TRANSITION_INITIAL = { opacity: 0, y: 10 };

export const PAGE_TRANSITION_ANIMATE = { opacity: 1, y: 0 };

export const PAGE_TRANSITION_EXIT = { opacity: 0, y: -6 };

export const PAGE_TRANSITION_TIMING = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1] as const,
};
