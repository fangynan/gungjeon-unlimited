// src/components/home/LandingHeader.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Menu", href: "/menu" },
  // NOTE: /grilling-guide does not exist yet in the repo; it will 404 until built.
  { label: "Grilling Guide", href: "/grilling-guide" },
] as const;

const CTA = { label: "View Table Availability", href: "/table-availability" } as const;

const EASE = "ease-out-quart";

export default function LandingHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // The mobile panel needs a solid bar behind it even at the top of the page.
  const solid = scrolled || open;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/*
        Two stacked background layers cross-fade on OPACITY only (compositor-friendly).
        - scrim: soft top gradient so links stay legible over a bright photo
        - bar:   solid dark bar + hairline gold border once scrolled
        No backdrop-filter, so prefers-reduced-transparency is satisfied by default.
      */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-200 ${EASE} motion-reduce:transition-none ${
          solid ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 border-b border-gold/20 bg-ink transition-opacity duration-200 ${EASE} motion-reduce:transition-none ${
          solid ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        {/* Wordmark */}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className={`flex min-w-0 items-baseline gap-2 transition-transform duration-100 ${EASE} active:scale-[0.97]`}
        >
          <span className="font-serif-display text-xl font-semibold tracking-tight text-paper sm:text-2xl">
            Gungjeon
          </span>
          <span lang="ko" className="font-serif-display text-sm text-gold">
            궁전
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`group relative py-2 text-[13px] font-medium uppercase tracking-[0.16em] transition-colors duration-100 ${EASE} active:scale-[0.97] ${
                  active ? "text-paper" : "text-paper/70 hover:text-gold"
                }`}
              >
                {l.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-0 -bottom-0.5 h-px origin-left bg-gold transition-transform duration-200 ${EASE} ${
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={CTA.href}
            className={`hidden h-11 items-center whitespace-nowrap bg-gold px-5 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink transition-[background-color,transform] duration-100 ${EASE} hover:bg-[#dcb872] active:scale-[0.97] md:inline-flex`}
          >
            {CTA.label}
          </Link>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="landing-mobile-nav"
            aria-label={open ? "Close navigation" : "Open navigation"}
            className={`flex h-11 w-11 items-center justify-center text-paper transition-transform duration-100 ${EASE} active:scale-95 md:hidden`}
          >
            <span className="relative block h-3 w-6">
              <span
                className={`absolute left-0 top-0 h-px w-full bg-current transition-transform duration-200 ${EASE} ${
                  open ? "translate-y-[6px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-200 ${EASE} ${
                  open ? "-translate-y-[5px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile panel: `invisible` removes it from tab order while closed. */}
      <nav
        id="landing-mobile-nav"
        aria-label="Mobile"
        className={`absolute inset-x-0 top-full border-b border-gold/20 bg-ink transition-[opacity,transform,visibility] duration-200 ${EASE} motion-reduce:transition-none md:hidden ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <ul>
          {LINKS.map((l) => (
            <li key={l.href} className="border-b border-white/5">
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`block px-6 py-4 font-serif-display text-xl ${
                  isActive(l.href) ? "text-gold" : "text-paper"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="p-4">
          <Link
            href={CTA.href}
            onClick={() => setOpen(false)}
            className={`flex h-12 items-center justify-center bg-gold text-[13px] font-semibold uppercase tracking-[0.14em] text-ink transition-transform duration-100 ${EASE} active:scale-[0.98]`}
          >
            {CTA.label}
          </Link>
        </div>
      </nav>
    </header>
  );
}
