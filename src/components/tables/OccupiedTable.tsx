// src/components/tables/OccupiedTable.tsx
"use client";

import { motion } from "motion/react";
import type { RestaurantTable } from "@/types";
import TableFrame from "./TableFrame";
import { tableEnter } from "./table-motion";

export default function OccupiedTable({ table }: { table: RestaurantTable }) {
  return (
    <motion.div
      variants={tableEnter}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="h-full"
    >
      <TableFrame tone="occupied">
        <div className="flex h-full flex-col items-center px-4 pb-5 pt-8 text-center sm:px-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-neutral-500">Table</p>
          <p className="mt-1 max-w-full break-words font-serif-display text-4xl leading-none text-neutral-400 sm:text-5xl">
            {table.table_number}
          </p>

          {/* A grill in use. Colours here are inline styles on purpose, so the circle
              never depends on Tailwind generating them. */}
          <div className="my-6 flex flex-1 items-center justify-center">
            <div className="rounded-full p-2" style={{ border: "1px dashed #3f3f46" }}>
              <div
                className="relative flex size-24 flex-col items-center justify-center gap-1 overflow-hidden rounded-full sm:size-28"
                style={{
                  backgroundColor: "#1a1818",
                  border: "1px solid #3f3f46",
                  boxShadow: "0 0 0 2px rgba(185,28,28,0.5), inset 0 0 28px rgba(185,28,28,0.3)",
                }}
              >
                {/* ember glow rising from the bottom of the plate */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-3/5"
                  style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(220,38,38,0.38), transparent 70%)" }}
                />
                <motion.svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  width={34}
                  height={34}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: "drop-shadow(0 0 8px rgba(185,28,28,0.85))" }}
                  className="relative"
                  animate={{ opacity: [0.65, 1, 0.65] }}
                  transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
                >
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </motion.svg>
                {/* "in the middle of a meal" */}
                <span lang="ko" className="relative font-serif-display text-[15px] leading-none text-red-400">
                  식사 중
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-neutral-500">{table.capacity} seats</p>
          {table.location && <p className="mt-0.5 text-xs text-neutral-600">{table.location}</p>}

          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-700/60 bg-red-950/60 px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.2em] text-red-400">
            <span aria-hidden className="size-2 rounded-full bg-red-600" />
            Occupied
          </span>
          <p className="mt-3 font-serif-display text-sm text-red-400/90">Feast in progress</p>
        </div>
      </TableFrame>
    </motion.div>
  );
}
