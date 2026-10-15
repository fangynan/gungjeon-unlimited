// src/components/tables/TableFrame.tsx
import type { ReactNode } from "react";
import { makeTilePattern } from "./table-pattern";

export type TableTone = "available" | "occupied";

const TONES = {
  available: {
    surface: "bg-[#0b1310]",
    border: "border-emerald-400/30",
    frame: "border-emerald-300/15",
    ornament: "bg-emerald-300",
    stripe: "from-emerald-600 via-[#c9a45c] to-emerald-600",
    wash: "from-emerald-500/10",
    pattern: makeTilePattern("#6ee7b7"),
    patternOpacity: "opacity-[0.12]",
  },
  occupied: {
    surface: "bg-[#141313]",
    border: "border-neutral-700/80",
    frame: "border-neutral-600/25",
    ornament: "bg-red-700",
    stripe: "from-red-950 via-red-600 to-red-950",
    wash: "from-red-900/25",
    pattern: makeTilePattern("#9ca3af"),
    patternOpacity: "opacity-[0.07]",
  },
} as const;

/**
 * Shared "palace gate" shell for every table card:
 *  - low-opacity royal lattice pattern as the background
 *  - dancheong-style stripe along the top
 *  - a double-line inner frame with diamond ornaments at the edge midpoints
 */
export default function TableFrame({ tone, children }: { tone: TableTone; children: ReactNode }) {
  const t = TONES[tone];
  return (
    <div className={`relative h-full overflow-hidden rounded-3xl border ${t.border} ${t.surface}`}>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${t.patternOpacity}`}
        style={{ backgroundImage: t.pattern, backgroundSize: "64px 64px" }}
      />
      <div aria-hidden className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${t.wash} to-transparent`} />
      <div aria-hidden className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${t.stripe}`} />

      <div aria-hidden className={`pointer-events-none absolute inset-2 rounded-2xl border ${t.frame}`}>
        <span className={`absolute -top-[3px] left-1/2 size-1.5 -translate-x-1/2 rotate-45 ${t.ornament}`} />
        <span className={`absolute -bottom-[3px] left-1/2 size-1.5 -translate-x-1/2 rotate-45 ${t.ornament}`} />
        <span className={`absolute -left-[3px] top-1/2 size-1.5 -translate-y-1/2 rotate-45 ${t.ornament}`} />
        <span className={`absolute -right-[3px] top-1/2 size-1.5 -translate-y-1/2 rotate-45 ${t.ornament}`} />
      </div>

      <div className="relative h-full">{children}</div>
    </div>
  );
}
