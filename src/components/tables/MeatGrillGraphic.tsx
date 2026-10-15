// src/components/tables/MeatGrillGraphic.tsx
"use client";

import { useId } from "react";
import { motion } from "motion/react";

/**
 * Top-down illustration: a round grill with sizzling strips of marbled pork belly,
 * glowing embers underneath and smoke drifting up. Pure SVG, so it stays crisp at any
 * size. All colours are SVG attributes (no Tailwind colour classes needed).
 */

// One strip of pork belly: red meat, cream fat ribbons, grill sear marks, a soft sheen.
function Strip({ y, angle }: { y: number; angle: number }) {
  return (
    <g transform={`translate(60 ${y}) rotate(${angle})`}>
      <rect x="-28" y="-8" width="56" height="16" rx="7.5" fill="#d9776b" stroke="#a8553b" strokeWidth="1.2" />
      <path d="M-24 -3.2Q-10 -6.2 2 -3.2T25 -3" fill="none" stroke="#fde7e1" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M-24 3Q-8 6 8 3T25 3.8" fill="none" stroke="#f3b3a8" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M-15 -7L-10 7M-2 -7L3 7M11 -7L16 7" fill="none" stroke="#5a2418" strokeWidth="1.7" strokeLinecap="round" opacity="0.5" />
      <ellipse cx="-12" cy="-4.5" rx="9" ry="1.6" fill="#ffffff" opacity="0.22" />
    </g>
  );
}

const SMOKE = [
  { d: "M44 31C40 25 48 21 44 13", delay: 0 },
  { d: "M60 29C56 22 64 18 60 9", delay: 0.9 },
  { d: "M76 31C72 25 80 21 76 13", delay: 1.8 },
];
const SPARKS = [
  { cx: 30, cy: 52, delay: 0.2 },
  { cx: 91, cy: 70, delay: 0.9 },
  { cx: 84, cy: 40, delay: 1.5 },
  { cx: 36, cy: 86, delay: 0.5 },
];

export default function MeatGrillGraphic({ className = "block size-24 sm:size-28" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" aria-hidden className={className}>
      <defs>
        <radialGradient id={`${uid}-ember`} cx="50%" cy="55%" r="55%">
          <stop offset="0" stopColor="#f59e0b" stopOpacity="0.6" />
          <stop offset="0.6" stopColor="#b45309" stopOpacity="0.28" />
          <stop offset="1" stopColor="#7c2d12" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}-clip`}>
          <circle cx="60" cy="60" r="50" />
        </clipPath>
      </defs>

      {/* plate, gold rim, embers */}
      <circle cx="60" cy="60" r="58" fill="#14110f" />
      <circle cx="60" cy="60" r="56.5" fill="none" stroke="#c9a45c" strokeOpacity="0.55" strokeWidth="1" />
      <circle cx="60" cy="60" r="50" fill="#1c1917" />
      <circle cx="60" cy="60" r="50" fill={`url(#${uid}-ember)`} />

      {/* grate */}
      <g clipPath={`url(#${uid}-clip)`} stroke="#57534e" strokeWidth="2.4">
        {[14, 23, 32, 41, 50, 59, 68, 77, 86, 95, 104].map((y) => (
          <line key={y} x1="0" x2="120" y1={y} y2={y} />
        ))}
      </g>
      <circle cx="60" cy="60" r="50" fill="none" stroke="#78716c" strokeWidth="3" />

      {/* the meat */}
      <Strip y={38} angle={-10} />
      <Strip y={60} angle={6} />
      <Strip y={82} angle={-5} />

      {/* sizzle */}
      {SPARKS.map((s) => (
        <motion.circle
          key={`${s.cx}-${s.cy}`}
          cx={s.cx}
          cy={s.cy}
          r="1.3"
          fill="#fcd34d"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
        />
      ))}

      {/* smoke */}
      {SMOKE.map((w) => (
        <motion.path
          key={w.d}
          d={w.d}
          fill="none"
          stroke="#e7e5e4"
          strokeWidth="2.4"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0], y: [0, -3, -6] }}
          transition={{ duration: 3.2, repeat: Infinity, delay: w.delay, ease: "easeOut" }}
        />
      ))}
    </svg>
  );
}
