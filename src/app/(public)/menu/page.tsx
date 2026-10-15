"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { formatPrice, sortCategories } from "@/lib/menu-categories";
import type { MenuItem } from "@/types";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { serif } from "@/lib/fonts";
import { fadeUp, stagger } from "@/components/home/motion-presets";

const ALL = "All";

// UI-only helper (no data logic): after a category tab is clicked, bring the menu back
// into view if the visitor had scrolled past the top of it. 164 = fixed header (92px)
// + sticky category bar (~56px) + breathing room. Keep in sync with `scroll-mt-[164px]` below.
function jumpToMenuTop() {
  const el = document.getElementById("menu-content");
  if (!el || el.getBoundingClientRect().top >= 164) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

// UI-only: styles whatever formatPrice() returns. Peso sign is drawn small and raised;
// "Included" (price 0) becomes a green pill. No data logic here.
function Price({ text, free }: { text: string; free: boolean }) {
  if (free) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-300">
        <span aria-hidden>✓</span>
        {text}
      </span>
    );
  }
  const hasPeso = text.startsWith("₱");
  return (
    <span className="shrink-0 font-serif-display text-[1.65rem] leading-none tabular-nums text-gold">
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {hasPeso && <span className="mr-0.5 align-top text-[0.5em] leading-none">₱</span>}
        {hasPeso ? text.slice(1) : text}
      </span>
    </span>
  );
}

// UI-only: round gold icon badge for the house-rules board.
function RuleIcon({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="flex size-14 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.06] text-gold"
    >
      <svg viewBox="0 0 24 24" className="size-7 fill-none stroke-current" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  );
}

export default function PublicMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(ALL);

  useEffect(() => {
    apiFetch<MenuItem[]>("/api/menu").then((res) => {
      if (res.success && res.data) {
        // Visitors only see items marked Available.
        setItems(res.data.filter((i) => i.is_available));
        setError(null);
      } else {
        setError(res.error ?? "Could not load the menu.");
      }
      setLoading(false);
    });
  }, []);

  const categories = useMemo(() => sortCategories(items.map((i) => i.category)), [items]);

  const sections = useMemo(() => {
    const shown = active === ALL ? categories : categories.filter((c) => c === active);
    return shown.map((category) => {
      const list = items.filter((i) => i.category === category);
      // Packages: most expensive first. Everything else: A to Z (already sorted by the API).
      if (category === "Unli Sets") list.sort((a, b) => b.price - a.price);
      return { category, list };
    });
  }, [items, categories, active]);

  return (
    <main className={`${serif.variable} bg-ink font-sans text-paper`}>
      {/* ───────── Page heading ───────── */}
      <section className="relative overflow-hidden px-6 pb-14 pt-16 text-center sm:px-10 sm:pb-16 sm:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 size-[36rem] -translate-x-1/2 rounded-full bg-ember/15 blur-3xl"
        />
        <motion.div
          variants={stagger(0.1, 0.14)}
          initial="hidden"
          animate="show"
          className="relative mx-auto max-w-3xl space-y-6"
        >
          <motion.p variants={fadeUp} lang="ko" className="font-serif-display text-lg text-gold">
            메뉴
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="font-serif-display text-[clamp(2.5rem,7vw,4.5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-paper"
          >
            The Menu
          </motion.h1>
          <motion.div variants={fadeUp} aria-hidden className="flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-gold/40" />
            <span className="size-1.5 rotate-45 bg-gold" />
            <span className="h-px w-12 bg-gold/40" />
          </motion.div>
          <motion.p variants={fadeUp} className="mx-auto max-w-xl text-pretty text-base leading-8 text-paper/75 sm:text-lg">
            Everything below is served unlimited unless marked as an add-on.
          </motion.p>
        </motion.div>

        {/* ───────── House rules board ───────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="relative mx-auto mt-14 max-w-4xl bg-gradient-to-br from-gold via-gold/25 to-gold/80 p-px shadow-[0_0_90px_-35px_rgba(201,164,92,0.45)]"
        >
          <div className="bg-[#0e0c0a] px-6 py-8 sm:px-10">
            <div className="flex items-center justify-center gap-4 pb-6">
              <span aria-hidden className="h-px w-10 bg-gradient-to-r from-transparent to-gold/60" />
              <p className="text-[12px] font-medium uppercase tracking-[0.3em] text-gold">House Rules</p>
              <span aria-hidden className="h-px w-10 bg-gradient-to-l from-transparent to-gold/60" />
            </div>

            <ul className="grid divide-y divide-gold/15 md:grid-cols-3 md:divide-x md:divide-y-0">
              <li className="flex flex-col items-center justify-center gap-4 px-4 py-6 text-center md:py-3">
                <RuleIcon>
                  <circle cx="12" cy="12" r="8" />
                  <circle cx="12" cy="12" r="4.5" />
                </RuleIcon>
                <p className="font-serif-display text-xl leading-snug text-paper">
                  <span className="text-gold">No left-over</span> policy
                </p>
              </li>

              <li className="flex flex-col items-center justify-center gap-4 px-4 py-6 text-center md:py-3">
                <RuleIcon>
                  <path d="M12 4v15M7 19h10M5 8l7-3 7 3" />
                  <path d="M5 8l-2.5 6a3 3 0 0 0 5 0L5 8zM19 8l-2.5 6a3 3 0 0 0 5 0L19 8z" />
                </RuleIcon>
                <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-paper/70">
                  Left-overs are charged
                  <span className="mt-2 block font-serif-display text-[1.65rem] normal-case leading-none tracking-normal text-gold">
                    ₱1 per gram
                  </span>
                </p>
              </li>

              <li className="flex flex-col items-center justify-center gap-4 px-4 py-6 text-center md:py-3">
                <RuleIcon>
                  <path d="M3 11h18M5 11v8M19 11v8" />
                  <circle cx="12" cy="6.5" r="2.5" />
                </RuleIcon>
                <p className="font-serif-display text-xl leading-snug text-paper">
                  <span className="text-gold">1 Unli set</span> per table
                </p>
              </li>
            </ul>
          </div>
        </motion.div>
      </section>

      {/* ───────── Menu ───────── */}
      <section className="relative pb-24">
        {loading ? (
          <p className="mx-auto max-w-6xl px-6 py-16 text-center text-paper/60">Loading the menu...</p>
        ) : error ? (
          <p className="mx-auto max-w-6xl px-6 py-16 text-center text-red-400">{error}</p>
        ) : items.length === 0 ? (
          <p className="mx-auto max-w-6xl px-6 py-16 text-center text-paper/60">The menu is being updated. Please check back soon.</p>
        ) : (
          <>
            {/* Sticky category bar: sits under the fixed 92px header. Scrolls sideways on phones. */}
            <nav aria-label="Menu categories" className="sticky top-[92px] z-40 border-y border-gold/15 bg-ink">
              <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
                {[ALL, ...categories].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setActive(c);
                      jumpToMenuTop();
                    }}
                    aria-pressed={active === c}
                    className={`group relative shrink-0 whitespace-nowrap px-4 py-4 text-[12px] font-medium uppercase tracking-[0.16em] transition-[color,transform] duration-100 ease-[cubic-bezier(0.25,1,0.5,1)] active:scale-95 ${
                      active === c ? "text-gold" : "text-paper/65 hover:text-paper"
                    }`}
                  >
                    {c}
                    <span
                      aria-hidden
                      className={`absolute inset-x-4 bottom-2 h-px origin-center bg-gold transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                        active === c ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </nav>

            <div
              id="menu-content"
              className="mx-auto max-w-6xl scroll-mt-[164px] space-y-16 px-4 pt-12 sm:px-6 lg:space-y-20 lg:pt-16"
            >
              {sections.map(({ category, list }) => (
                <div key={category} className="space-y-8">
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.6 }}
                    className="flex items-center gap-5"
                  >
                    <h2 className="font-serif-display text-3xl font-normal leading-tight tracking-[-0.01em] text-paper sm:text-4xl">
                      {category}
                    </h2>
                    <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-gold/40 to-transparent" />
                  </motion.div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((item) => (
                      <motion.article
                        key={item.id}
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.2 }}
                        className="min-w-0"
                      >
                        {/* Hover: lifts 4px and the border turns gold. */}
                        <div className="group flex h-full flex-col overflow-hidden border border-white/10 bg-[#0d0c0b] transition-[transform,border-color] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-1 hover:border-gold/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                          {/* Fixed 4:3 box so every card is the same height whatever the photo size */}
                          <div className="relative aspect-[4/3] overflow-hidden bg-neutral-800">
                            <div className="absolute inset-0 transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                              {item.image_url ? (
                                // ITEM IMAGE: real photos come from the database (`item.image_url`).
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="size-full object-cover"
                                />
                              ) : (
                                // PLACEHOLDER: shown when an item has no `image_url` yet.
                                // Once you upload a photo for it in the admin, the <img> above replaces this.
                                <div className="absolute inset-0 animate-pulse bg-neutral-800 motion-reduce:animate-none">
                                  <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                                    Photo coming soon
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col gap-3 p-5">
                            <div className="flex items-end gap-3">
                              <h3 className="min-w-0 break-words font-serif-display text-xl font-normal leading-snug text-paper">
                                {item.name}
                              </h3>
                              {/* dotted leader, like a printed menu */}
                              <span aria-hidden className="mb-1.5 min-w-4 flex-1 border-b border-dotted border-white/20" />
                              <Price text={formatPrice(item.price)} free={item.price === 0} />
                            </div>
                            {item.description && (
                              <p className="font-sans text-sm leading-relaxed text-neutral-400">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}