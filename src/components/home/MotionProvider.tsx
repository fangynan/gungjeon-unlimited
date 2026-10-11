// src/components/home/MotionProvider.tsx
"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

/**
 * reducedMotion="user": when the OS asks for reduced motion, Motion drops
 * transform animations (y / x / scale) and keeps opacity fades.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
