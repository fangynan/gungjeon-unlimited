// src/components/public/PublicFooter.tsx
"use client";

import Link from "next/link";
import { MotionConfig, motion } from "motion/react";
import { RESTAURANT } from "@/lib/restaurant-info";
import { serif } from "@/lib/fonts";
import { fadeUp, stagger } from "@/components/home/motion-presets";
import BrandLogo from "./BrandLogo";

const SNAP = "ease-[cubic-bezier(0.25,1,0.5,1)]";
const CTA_LABEL = "Reserve a Table"; // text only; the route is unchanged

const NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Menu", href: "/menu" },
  { label: "Table Availability", href: "/table-availability" },
  { label: "Contact", href: "/contact" },
];

const SOCIALS = [
  { label: "Facebook", short: "FB" },
  { label: "Instagram", short: "IG" },
  { label: "TikTok", short: "TT" },
];

// Same typography as the header links
const linkClass = `inline-block text-[12px] font-medium uppercase tracking-[0.14em] text-paper/70 transition-[color,transform] duration-100 ${SNAP} hover:translate-x-1 hover:text-gold active:scale-95`;

const labelClass = "text-[12px] font-medium uppercase tracking-[0.3em] text-gold";

const viewport = { once: true, amount: 0.25 } as const;

export default function PublicFooter() {
  return (
    <MotionConfig reducedMotion="user">
      <footer className={`${serif.variable} border-t border-gold/20 bg-ink text-paper`}>
        {/* Brand banner */}
        <div className="border-b border-white/10 bg-[#0f0d0b]">
          <motion.div
            variants={stagger(0, 0.1)}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-16"
          >
            <div className="flex min-w-0 items-center gap-5">
              <motion.div variants={fadeUp}>
                <BrandLogo className="size-16 sm:size-20" sizes="80px" />
              </motion.div>
              <div className="min-w-0">
                <motion.p
                  variants={fadeUp}
                  className="break-words font-serif-display text-3xl leading-none tracking-[-0.01em] text-paper sm:text-4xl"
                >
                  {RESTAURANT.name}
                </motion.p>
                <motion.p variants={fadeUp} className="mt-3 max-w-md text-sm leading-relaxed text-paper/65">
                  {RESTAURANT.tagline}
                </motion.p>
              </div>
            </div>

            <motion.div variants={fadeUp} className="self-start lg:self-auto">
              <Link
                href="/table-availability"
                className={`group relative inline-flex h-12 items-center overflow-hidden bg-gold px-7 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink shadow-[0_0_28px_-8px_rgba(201,164,92,0.7)] transition-transform duration-100 ${SNAP} active:scale-95`}
              >
                <span
                  aria-hidden
                  className={`absolute inset-0 -translate-x-full bg-[#f1dcaa] transition-transform duration-200 ${SNAP} group-hover:translate-x-0`}
                />
                <span className="relative flex items-center gap-2">
                  {CTA_LABEL}
                  <span aria-hidden className={`transition-transform duration-200 ${SNAP} group-hover:translate-x-1`}>
                    →
                  </span>
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Info columns */}
        <motion.div
          variants={stagger(0, 0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:grid-cols-2 sm:px-10 lg:grid-cols-4 lg:gap-10 lg:px-16"
        >
          {/* Location */}
          <motion.section variants={fadeUp} className="min-w-0 space-y-4">
            <h2 className={labelClass}>Location</h2>
            <address className="space-y-1 not-italic">
              <p className="font-serif-display text-lg leading-snug text-paper">{RESTAURANT.addressLine1}</p>
              <p className="text-sm text-paper/65">{RESTAURANT.addressLine2}</p>
            </address>
          </motion.section>

          {/* Hours */}
          <motion.section variants={fadeUp} className="min-w-0 space-y-4">
            <h2 className={labelClass}>Hours</h2>
            <dl>
              <div className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-3">
                <dt className="text-[12px] font-medium uppercase tracking-[0.14em] text-paper/65">Daily</dt>
                <dd className="font-serif-display text-lg tabular-nums text-gold">{RESTAURANT.hours}</dd>
              </div>
            </dl>
          </motion.section>

          {/* Contact + social placeholders */}
          <motion.section variants={fadeUp} className="min-w-0 space-y-4">
            <h2 className={labelClass}>Contact</h2>
            <ul className="space-y-2">
              <li>
                <a
                  href={`tel:${RESTAURANT.phoneLink}`}
                  className={`inline-block text-sm tracking-wider text-paper transition-colors duration-100 ${SNAP} hover:text-gold active:scale-95`}
                >
                  {RESTAURANT.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${RESTAURANT.email}`}
                  className={`inline-block break-all text-sm tracking-wider text-paper/65 transition-colors duration-100 ${SNAP} hover:text-gold active:scale-95`}
                >
                  {RESTAURANT.email}
                </a>
              </li>
            </ul>

            {/* ─────────────────────────────────────────────────────────────
                SOCIAL ICON PLACEHOLDERS (one <div> per network)
                To make one real, replace its <div> with, for example:

                  <a
                    href="https://facebook.com/YOUR-PAGE"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="flex size-11 items-center justify-center rounded-full border border-gold/40 text-paper transition-[color,border-color,transform] duration-100 ease-[cubic-bezier(0.25,1,0.5,1)] hover:border-gold hover:text-gold active:scale-95"
                  >
                    <Image src="/icons/facebook.svg" alt="" width={20} height={20} />
                  </a>

                (add `import Image from "next/image"` and put the SVG in public/icons/)
               ───────────────────────────────────────────────────────────── */}
            <ul className="flex items-center gap-3 pt-2">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <div
                    role="img"
                    aria-label={`${s.label} icon placeholder`}
                    className="flex size-11 animate-pulse items-center justify-center rounded-full border border-dashed border-gold/40 bg-neutral-800 font-mono text-[10px] uppercase tracking-widest text-neutral-300 motion-reduce:animate-none"
                  >
                    {s.short}
                  </div>
                </li>
              ))}
            </ul>
          </motion.section>

          {/* Navigate */}
          <motion.section variants={fadeUp} className="min-w-0 space-y-4">
            <h2 className={labelClass}>Navigate</h2>
            <ul className="space-y-3">
              {NAV.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.section>
        </motion.div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 bg-[#0f0d0b]">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-[11px] font-medium uppercase tracking-[0.18em] text-paper/50 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
            <p>
              © {new Date().getFullYear()} {RESTAURANT.name}
            </p>
            <p className="flex items-center gap-2">
              <span className="inline-block size-1.5 rounded-full bg-gold" aria-hidden />
              <span>Open daily {RESTAURANT.hours}</span>
            </p>
            <Link
              href="/login"
              className={`inline-block self-start border border-white/15 px-3 py-1 transition-[border-color,color,transform] duration-100 ${SNAP} hover:border-gold hover:text-gold active:scale-95 sm:self-auto`}
            >
              Staff login
            </Link>
          </div>
        </div>
      </footer>
    </MotionConfig>
  );
}
