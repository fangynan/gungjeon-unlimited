// src/components/tables/AvailableTable.tsx
"use client";

import { motion, type Variants } from "motion/react";
import type { RestaurantTable } from "@/types";
import { EASE_OUT } from "@/components/home/motion-presets";
import TableFrame from "./TableFrame";
import { tableEnter, tableSpring } from "./table-motion";
   import Image from "next/image";

// Hover: the card lifts and a soft green glow fades in behind it.
const lift: Variants = {
  rest: { y: 0, scale: 1, transition: tableSpring },
  hover: { y: -6, transition: tableSpring },
  tap: { scale: 0.98, transition: { duration: 0.1, ease: EASE_OUT } },
};
const glow: Variants = {
  rest: { opacity: 0, transition: { duration: 0.3, ease: EASE_OUT } },
  hover: { opacity: 1, transition: { duration: 0.3, ease: EASE_OUT } },
};

export default function AvailableTable({ table }: { table: RestaurantTable }) {
  return (
    <motion.div
      variants={tableEnter}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="h-full"
    >
      <motion.div
        variants={lift}
        initial="rest"
        animate="rest"
        whileHover="hover"
        whileTap="tap"
        className="relative h-full"
      >
        {/* soft green glow behind the card */}
        <motion.div
          aria-hidden
          variants={glow}
          className="pointer-events-none absolute -inset-2 rounded-[2rem] bg-emerald-400/25 blur-2xl"
        />

        <TableFrame tone="available">
          <div className="flex h-full flex-col items-center px-4 pb-5 pt-8 text-center sm:px-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-emerald-300/70">Table</p>
            <p className="mt-1 max-w-full break-words font-serif-display text-4xl leading-none text-paper sm:text-5xl">
              {table.table_number}
            </p>

            <div className="my-6 flex flex-1 items-center justify-center">
              <div className="rounded-full p-2" style={{ border: "1px dashed rgba(110,231,183,0.4)" }}>
                {/* <!-- INSERT COOKING MEAT GRAPHIC HERE --> */}
                {/* inline backgroundColor = same grey as bg-neutral-700, so it is always visible */}
                <div
                  className="flex size-24 animate-pulse items-center justify-center rounded-full bg-neutral-700 motion-reduce:animate-none sm:size-28"
                  style={{ backgroundColor: "#404040" }}
                >
                  <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-300"></span>
                </div>
              </div>
            </div>

            <p className="text-sm text-paper/80">{table.capacity} seats</p>
            {table.location && <p className="mt-0.5 text-xs text-paper/50">{table.location}</p>}

            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-emerald-300 shadow-[0_0_22px_-6px_rgba(52,211,153,0.7)]">
              <span aria-hidden className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              Available
            </span>
          </div>
        </TableFrame>
      </motion.div>
    </motion.div>
  );
}
