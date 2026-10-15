"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { RestaurantTable } from "@/types";
import { MotionConfig, motion } from "motion/react";
import { serif } from "@/lib/fonts";
import { fadeUp, stagger } from "@/components/home/motion-presets";
import AvailableTable from "@/components/tables/AvailableTable";
import OccupiedTable from "@/components/tables/OccupiedTable";
import FilterPill from "@/components/tables/FilterPill";
import AvailabilitySummary from "@/components/tables/AvailabilitySummary";

type Filter = "all" | "available" | "occupied";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All tables" },
  { key: "available", label: "Available" },
  { key: "occupied", label: "Occupied" },
];

// ───────── UI-only: royal palace pattern (no data logic) ─────────
// A 120px seamless tile: gold lotus medallions on a diamond lattice, in the spirit of
// Dancheong / palace lattice work. Corner medallions are cut by the tile edge and
// completed by the neighbouring tiles, so the repeat has no seams.
const GOLD = "#c9a45c";
const PETALS = Array.from(
  { length: 8 },
  (_, k) => `<ellipse cx="0" cy="-12" rx="4.5" ry="9" transform="rotate(${k * 45})"/>`
).join("");
const PATTERN_SVG =
  `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">` +
  `<defs><g id="m" fill="none" stroke="${GOLD}" stroke-width="1">` +
  `<circle r="3"/><circle r="21"/><circle r="30" stroke-dasharray="2 4"/>${PETALS}</g></defs>` +
  `<path d="M60 0L120 60L60 120L0 60Z" fill="none" stroke="${GOLD}" stroke-width=".8"/>` +
  `<g fill="${GOLD}"><circle cx="60" cy="0" r="2"/><circle cx="120" cy="60" r="2"/>` +
  `<circle cx="60" cy="120" r="2"/><circle cx="0" cy="60" r="2"/></g>` +
  `<use href="#m" x="60" y="60"/><use href="#m" x="0" y="0"/><use href="#m" x="120" y="0"/>` +
  `<use href="#m" x="0" y="120"/><use href="#m" x="120" y="120"/></svg>`;
const PATTERN = `url("data:image/svg+xml,${encodeURIComponent(PATTERN_SVG)}")`;

// UI-only: one row of the status legend. `filled` = occupied (solid), hollow = available.
function LegendItem({
  tone,
  filled,
  title,
  hint,
}: {
  tone: "available" | "occupied";
  filled: boolean;
  title: string;
  hint: string;
}) {
  const box =
    tone === "available"
      ? "border-emerald-400/60 bg-emerald-400/10"
      : "border-red-400/60 bg-red-500/15";
  const dot =
    tone === "available"
      ? filled ? "bg-emerald-400" : "border-2 border-emerald-400"
      : filled ? "bg-red-400" : "border-2 border-red-400";
  return (
    <li className="flex items-center gap-4 px-6 py-5 text-left">
      <span aria-hidden className={`flex size-10 shrink-0 items-center justify-center rounded-xl border-2 ${box}`}>
        <span className={`size-3.5 rounded-full ${dot}`} />
      </span>
      <span className="min-w-0">
        <span className="block font-serif-display text-xl leading-tight text-paper">{title}</span>
        <span className="mt-0.5 block text-sm text-paper/60">{hint}</span>
      </span>
    </li>
  );
}

export default function TableAvailabilityPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    const res = await apiFetch<RestaurantTable[]>("/api/tables");
    if (res.success && res.data) {
      setTables(res.data);
      setError(null);
    } else {
      setError(res.error ?? "Could not load the tables.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live updates: the public tables list is readable by anyone, so no sign-in is needed.
  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel("public-tables-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as RestaurantTable;
            setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          } else {
            // A table was added or removed: reload so the order stays correct.
            load();
          }
        }
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  // Safety net: when the page comes back into view (for example a phone screen wakes up), refresh.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const availableCount = tables.filter((t) => t.status === "available").length;

  const shown = useMemo(
    () => (filter === "all" ? tables : tables.filter((t) => t.status === filter)),
    [tables, filter]
  );

  return (
    <main className={`${serif.variable} relative isolate overflow-hidden bg-[#13110f] font-sans text-paper`}>
      {/* ───────── Background: palace pattern + warm glow ───────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08]"
        style={{ backgroundImage: PATTERN, backgroundSize: "120px 120px" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(155,28,28,0.24),transparent)]"
      />

      {/* ───────── Part 1: Hero + legend ───────── */}
      <section className="relative px-6 pb-16 pt-16 text-center sm:px-10 sm:pb-20 sm:pt-24">
        <MotionConfig reducedMotion="user">
          <motion.div
            variants={stagger(0.1, 0.14)}
            initial="hidden"
            animate="show"
            className="mx-auto flex max-w-3xl flex-col items-center"
          >
            {/* Reads the existing `live` state; changes nothing */}
            <motion.div
              variants={fadeUp}
              role="status"
              className="inline-flex items-center gap-2.5 rounded-full border border-gold/25 bg-white/[0.04] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-paper/80"
            >
              <span aria-hidden className="relative flex size-2">
                {live && (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70 motion-reduce:animate-none" />
                )}
                <span className={`relative inline-flex size-2 rounded-full ${live ? "bg-emerald-400" : "bg-neutral-500"}`} />
              </span>
              {live ? "Live now" : "Connecting..."}
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="mt-8 text-[12px] font-medium uppercase tracking-[0.3em] text-gold"
            >
              <span lang="ko" className="mr-3 font-serif-display text-base normal-case tracking-normal">
                궁전
              </span>
              Real-Time Royal Seating
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="mt-5 text-balance font-serif-display text-[clamp(2.25rem,8vw,5.5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-paper"
            >
              Palace <span className="text-gold">Availability</span>
            </motion.h1>

            {/* Dancheong-inspired accent: jade, gold and vermilion */}
            <motion.div variants={fadeUp} aria-hidden className="mt-8 flex items-center gap-3">
              <span className="h-px w-12 bg-gold/40" />
              <span className="size-1.5 rotate-45 bg-[#3f7a6e]" />
              <span className="size-2 rotate-45 bg-gold" />
              <span className="size-1.5 rotate-45 bg-[#9b1c1c]" />
              <span className="h-px w-12 bg-gold/40" />
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="mt-8 max-w-xl text-pretty text-base leading-8 text-paper/80 sm:text-lg"
            >
              See which tables are open before you head over. This page updates live, so you never
              need to refresh.
            </motion.p>

            {/* Legend */}
            <motion.div variants={fadeUp} className="mt-12 w-full max-w-xl">
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
                How to read the tables
              </p>
              <ul className="grid divide-y divide-gold/15 overflow-hidden rounded-2xl border border-gold/20 bg-white/[0.03] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <LegendItem tone="available" filled={false} title="Available" hint="Open and ready for you" />
                <LegendItem tone="occupied" filled title="Occupied" hint="Currently seated" />
              </ul>
            </motion.div>
          </motion.div>
        </MotionConfig>
      </section>

      {/* ───────── Part 2: tables (table grid) ───────── */}
      <section className="mx-auto max-w-6xl space-y-8 px-4 pb-24 pt-2 sm:px-6">
        {loading ? (
          <p className="py-12 text-center text-paper/60">Loading tables...</p>
        ) : error ? (
          <p className="py-12 text-center text-red-400">{error}</p>
        ) : tables.length === 0 ? (
          <p className="py-12 text-center text-paper/60">No tables to show yet.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 border-y border-gold/15 py-4">
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {FILTERS.map((f) => (
                  <FilterPill
                    key={f.key}
                    label={f.label}
                    active={filter === f.key}
                    onClick={() => setFilter(f.key)}
                  />
                ))}
              </div>

              <AvailabilitySummary available={availableCount} total={tables.length} />
            </div>

            {shown.length === 0 ? (
              <p className="py-12 text-center text-paper/60">No tables match this filter right now.</p>
            ) : (
              <MotionConfig reducedMotion="user">
                <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
                  {shown.map((t) => {
                    const available = t.status === "available";
                    return available ? (
                      <AvailableTable key={t.id} table={t} />
                    ) : (
                      <OccupiedTable key={t.id} table={t} />
                    );
                  })}
                </div>
              </MotionConfig>
            )}
          </>
        )}
      </section>
    </main>
  );
}