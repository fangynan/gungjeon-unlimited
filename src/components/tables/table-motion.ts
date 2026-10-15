// src/components/tables/table-motion.ts
import type { Variants } from "motion/react";
import { EASE_OUT } from "@/components/home/motion-presets";

/** Card entrance as it scrolls into view. */
export const tableEnter: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
};

/** Critically damped spring (no bounce), per our motion standards. */
export const tableSpring = { type: "spring", bounce: 0, duration: 0.4 } as const;
