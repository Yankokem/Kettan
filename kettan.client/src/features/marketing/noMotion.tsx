import type { HTMLAttributes, ReactNode } from "react";

type StaticMotionDivProps = HTMLAttributes<HTMLDivElement> & {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
  whileInView?: unknown;
  viewport?: unknown;
  whileHover?: unknown;
  layoutId?: string;
};

export function StaticMotionDiv({
  initial,
  animate,
  exit,
  transition,
  whileInView,
  viewport,
  whileHover,
  layoutId,
  ...rest
}: StaticMotionDivProps) {
  void initial;
  void animate;
  void exit;
  void transition;
  void whileInView;
  void viewport;
  void whileHover;
  void layoutId;

  return <div {...rest} />;
}

type StaticAnimatePresenceProps = {
  children: ReactNode;
  mode?: unknown;
  initial?: unknown;
};

export function StaticAnimatePresence({ children, mode, initial }: StaticAnimatePresenceProps) {
  void mode;
  void initial;
  return <>{children}</>;
}
