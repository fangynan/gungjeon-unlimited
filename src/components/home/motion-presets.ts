// src/components/home/motion-presets.ts
import type { Variants } from "motion/react";

/** Same curve as Tailwind's `ease-out-quart` token (see globals additions). */
export const EASE_OUT: [number, number, number, number] = [0.25, 1, 0.5, 1];

/** Parent: orchestrates children. Children inherit "hidden" / "show" by name. */
export const stagger = (delay = 0, gap = 0.12): Variants => ({
  hidden: {},
  show: { transition: { delayChildren: delay, staggerChildren: gap } },
});

/** Child: small, ease-out fade-up. 16px travel, transform + opacity only. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};
