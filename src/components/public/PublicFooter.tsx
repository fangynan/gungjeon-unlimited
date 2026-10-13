// src/components/public/PublicFooter.tsx
"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MotionConfig, motion } from "motion/react";
import { RESTAURANT } from "@/lib/restaurant-info";
import { serif } from "@/lib/fonts";
import { fadeUp, stagger } from "@/components/home/motion-presets";
import BrandLogo from "./BrandLogo";

const SNAP = "ease-[cubic-bezier(0.25,1,0.5,1)]";

const NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Menu", href: "/menu" },
  { label: "Table Availability", href: "/table-availability" },
  { label: "Contact", href: "/contact" },
];

// Same typography as the header links
const linkClass = `inline-block text-[12px] font-medium uppercase tracking-[0.14em] text-paper/70 transition-[color,transform] duration-100 ${SNAP} hover:translate-x-1 hover:text-gold active:scale-95`;

const labelClass = "text-[12px] font-medium uppercase tracking-[0.3em] text-gold";

const viewport = { once: true, amount: 0.25 } as const;

export default function PublicFooter() {
  const pathname = usePathname();

  // Already on that page? Don't navigate: glide back to the top instead.
  function handleNavClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
    if (pathname !== href) return; // different page: normal navigation
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <MotionConfig reducedMotion="user">
      <footer className={`${serif.variable} border-t border-gold/20 bg-ink text-paper`}>
        {/* Info columns */}
        <motion.div
          variants={stagger(0, 0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:grid-cols-2 sm:px-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr] lg:gap-10 lg:px-16"
        >
          {/* Brand: logo + name */}
          <motion.section variants={fadeUp} className="min-w-0 space-y-5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-4">
              <BrandLogo className="size-16" sizes="64px" />
              <p className="min-w-0 break-words font-serif-display text-2xl leading-tight text-paper">
                {RESTAURANT.name}
              </p>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-paper/65">{RESTAURANT.tagline}</p>
          </motion.section>

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

            <ul className="flex items-center gap-3 pt-2">
              <li>
                <a
                  href="https://www.facebook.com/juanciborestaurant"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook (opens in a new tab)"
                  className={`flex size-11 items-center justify-center rounded-full border border-gold/40 text-paper transition-[color,border-color,transform] duration-100 ${SNAP} hover:border-gold hover:text-gold active:scale-95`}
                >
                  <svg viewBox="0 0 24 24" aria-hidden className="size-5 fill-current">
                    <path d="M14 8.5V6.9c0-.7.2-1.1 1.2-1.1H17V3h-2.5C11.9 3 11 4.6 11 6.6v1.9H9v3h2V21h3v-9.5h2.4l.4-3H14z" />
                  </svg>
                </a>
              </li>
            </ul>
          </motion.section>

          {/* Navigate */}
          <motion.section variants={fadeUp} className="min-w-0 space-y-4">
            <h2 className={labelClass}>Navigate</h2>
            <ul className="space-y-3">
              {NAV.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={(e) => handleNavClick(e, l.href)} className={linkClass}>
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
