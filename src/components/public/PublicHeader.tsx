// src/components/public/PublicHeader.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, MotionConfig, motion, type Variants } from "motion/react";
import { RESTAURANT } from "@/lib/restaurant-info";
import { serif } from "@/lib/fonts";
import { EASE_OUT } from "@/components/home/motion-presets";
import BrandLogo from "./BrandLogo";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Menu", href: "/menu" },
  { label: "Pencil Booking", href: "/pencil-booking" },
  { label: "Contact", href: "/contact" },
];

const CTA_LABEL = "View Table Availability"; // text only; the route is /table-availability

/** Small pulsing "live" dot (opacity + size only). Dark green so it reads on the gold button. */
function LiveDot() {
  return (
    <span aria-hidden className="relative flex size-2 shrink-0">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-700/60 motion-reduce:animate-none" />
      <span className="relative inline-flex size-2 rounded-full bg-emerald-700" />
    </span>
  );
}

const SNAP = "ease-[cubic-bezier(0.25,1,0.5,1)]";

const panel: Variants = {
  hidden: { opacity: 0, y: -8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: EASE_OUT, delayChildren: 0.04, staggerChildren: 0.04 },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: EASE_OUT } },
};
const row: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE_OUT } },
};

export default function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  // The mobile panel needs a solid bar behind it even at the top of the page.
  const solid = scrolled || open;

  return (
    <MotionConfig reducedMotion="user">
      <header className={`${serif.variable} fixed inset-x-0 top-0 z-50`}>
        {/* Background layers cross-fade on opacity only (no backdrop-filter). */}
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-200 ${SNAP} motion-reduce:transition-none ${
            solid ? "opacity-0" : "opacity-100"
          }`}
        />
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 border-b border-gold/20 bg-ink transition-opacity duration-200 ${SNAP} motion-reduce:transition-none ${
            solid ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Status strip (28px) */}
        <div className="relative flex h-7 items-center justify-between border-b border-white/10 px-4 text-[11px] font-medium uppercase tracking-[0.2em] text-paper/60 sm:px-6 lg:px-8">
          <span className="flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-gold" aria-hidden />
            <span className="text-gold">Open daily</span>
            <span className="hidden sm:inline">/ {RESTAURANT.hours}</span>
          </span>
          <a
            href={`tel:${RESTAURANT.phoneLink}`}
            className={`transition-colors duration-100 ${SNAP} hover:text-gold active:scale-95`}
          >
            {RESTAURANT.phone}
          </a>
        </div>

        {/* Main bar (64px) */}
        <div className="relative mx-auto flex h-16 max-w-7xl items-stretch justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={`group flex min-w-0 items-center gap-3 transition-transform duration-100 ${SNAP} active:scale-95`}
          >
            <BrandLogo className="size-10" sizes="40px" priority />
            <span className="hidden truncate font-serif-display text-lg tracking-[0.03em] text-paper transition-colors duration-100 group-hover:text-gold min-[400px]:inline md:max-lg:hidden">
              {RESTAURANT.name}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden items-stretch md:flex">
            {LINKS.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex items-center px-3 text-[12px] font-medium uppercase tracking-[0.14em] transition-colors duration-100 ${SNAP} active:scale-95 lg:px-4 ${
                    active ? "text-paper" : "text-paper/70 hover:text-gold"
                  }`}
                >
                  {l.label}
                  <span
                    aria-hidden
                    className={`absolute inset-x-3 bottom-5 h-px origin-center bg-gold transition-transform duration-200 lg:inset-x-4 ${SNAP} ${
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {/* Booking CTA (live dot = check live availability) */}
            <Link
              href="/table-availability"
              onClick={() => setOpen(false)}
              aria-current={isActive("/table-availability") ? "page" : undefined}
              className={`group relative hidden h-10 items-center overflow-hidden bg-gold px-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink shadow-[0_0_28px_-8px_rgba(201,164,92,0.7)] transition-transform duration-100 ${SNAP} active:scale-95 md:inline-flex`}
            >
              <span
                aria-hidden
                className={`absolute inset-0 -translate-x-full bg-[#f1dcaa] transition-transform duration-200 ${SNAP} group-hover:translate-x-0`}
              />
              <span className="relative flex items-center gap-2.5">
                <LiveDot />
                {CTA_LABEL}
                <span className="sr-only">(live availability)</span>
                <span
                  aria-hidden
                  className={`transition-transform duration-200 ${SNAP} group-hover:translate-x-1`}
                >
                  →
                </span>
              </span>
            </Link>

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className={`h-10 border px-4 text-[12px] font-semibold uppercase tracking-[0.16em] transition-[background-color,border-color,color,transform] duration-100 ${SNAP} active:scale-95 md:hidden ${
                open
                  ? "border-gold bg-gold text-ink"
                  : "border-gold/40 bg-transparent text-paper hover:border-gold hover:text-gold"
              }`}
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        {/* Mobile panel: mounts/unmounts with Framer Motion, so it is interruptible */}
        <AnimatePresence>
          {open && (
            <motion.nav
              key="mobile-nav"
              id="mobile-nav"
              aria-label="Mobile"
              variants={panel}
              initial="hidden"
              animate="show"
              exit="exit"
              className="absolute inset-x-0 top-full border-b border-gold/20 bg-ink md:hidden"
            >
              <ul className="grid">
                {LINKS.map((l, i) => {
                  const active = isActive(l.href);
                  return (
                    <motion.li key={l.href} variants={row} className="border-b border-white/10">
                      <Link
                        href={l.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center justify-between px-4 py-4 font-serif-display text-xl transition-[background-color,color,transform] duration-100 ${SNAP} active:scale-[0.98] sm:px-6 ${
                          active
                            ? "bg-white/[0.04] text-gold"
                            : "text-paper hover:bg-white/[0.04] hover:text-gold"
                        }`}
                      >
                        <span>{l.label}</span>
                        <span className="font-sans text-xs tabular-nums tracking-widest text-paper/40">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
              <motion.div variants={row} className="p-4 sm:px-6">
                <Link
                  href="/table-availability"
                  onClick={() => setOpen(false)}
                  className={`flex h-12 items-center justify-center gap-2.5 bg-gold text-[13px] font-semibold uppercase tracking-[0.16em] text-ink transition-transform duration-100 ${SNAP} active:scale-[0.98]`}
                >
                  <LiveDot />
                  {CTA_LABEL}
                  <span className="sr-only">(live availability)</span>
                  <span aria-hidden>→</span>
                </Link>
              </motion.div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </MotionConfig>
  );
}
