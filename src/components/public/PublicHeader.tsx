// src/components/public/PublicHeader.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RESTAURANT } from "@/lib/restaurant-info";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Menu", href: "/menu" },
  { label: "Table Availability", href: "/table-availability" },
  { label: "Contact", href: "/contact" },
];

const SNAP = "ease-[cubic-bezier(0.25,1,0.5,1)]";

export default function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 rounded-none border-b border-red-600/30 bg-[#000000]">
      {/* Status strip */}
      <div className="flex h-7 items-center justify-between rounded-none border-b border-white/10 bg-[#1A1A1A] px-4 font-mono text-[11px] font-bold uppercase tracking-widest text-[#A0AEC0]">
        <span className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-none bg-[#E53E3E]" aria-hidden />
          <span className="text-[#ECC94B]">Open daily</span>
          <span className="hidden sm:inline">/ {RESTAURANT.hours}</span>
        </span>
        <a
          href={`tel:${RESTAURANT.phoneLink}`}
          className={`transition-colors duration-100 ${SNAP} hover:text-[#ECC94B] active:scale-95`}
        >
          {RESTAURANT.phone}
        </a>
      </div>

      {/* Main bar */}
      <div className="mx-auto flex h-16 max-w-6xl items-stretch justify-between px-4">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className={`group flex items-center gap-3 transition-transform duration-100 ${SNAP} active:scale-95`}
        >
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-none bg-[#E53E3E] font-mono text-sm font-extrabold tracking-wider text-white transition-colors duration-100 ${SNAP} group-hover:bg-[#ECC94B] group-hover:text-black`}
          >
            GU
          </span>
          <span className="text-sm font-extrabold uppercase tracking-wider text-white sm:text-lg">
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
                className={`group relative flex items-center rounded-none border-l border-white/10 px-4 text-xs font-extrabold uppercase tracking-wider transition-colors duration-100 ${SNAP} active:scale-95 ${
                  active ? "text-white" : "text-[#A0AEC0] hover:text-[#ECC94B]"
                }`}
              >
                {l.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-0 bottom-0 h-[3px] origin-left bg-[#E53E3E] transition-transform duration-150 ${SNAP} ${
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {/* Booking CTA */}
          <Link
            href="/table-availability"
            onClick={() => setOpen(false)}
            className={`group relative hidden h-10 items-center overflow-hidden rounded-none bg-[#ECC94B] px-5 font-mono text-xs font-extrabold uppercase tracking-widest text-black transition-[color,transform] duration-100 ${SNAP} hover:text-white active:scale-95 md:inline-flex`}
          >
            <span
              aria-hidden
              className={`absolute inset-0 -translate-x-full bg-[#E53E3E] transition-transform duration-150 ${SNAP} group-hover:translate-x-0`}
            />
            <span className="relative">View Available Tables →</span>
          </Link>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className={`h-10 rounded-none border border-white/10 px-4 font-mono text-xs font-extrabold uppercase tracking-widest transition-[background-color,color,transform] duration-100 ${SNAP} active:scale-95 md:hidden ${
              open
                ? "bg-[#E53E3E] text-white"
                : "bg-transparent text-white hover:bg-[#ECC94B] hover:text-black"
            }`}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <nav
        id="mobile-nav"
        aria-label="Mobile"
        aria-hidden={!open}
        className={`absolute inset-x-0 top-full rounded-none border-b border-red-600/30 bg-[#000000] transition-[clip-path,visibility] duration-200 ${SNAP} motion-reduce:transition-none md:hidden ${
          open
            ? "visible [clip-path:inset(0_0_0_0)]"
            : "invisible [clip-path:inset(0_0_100%_0)]"
        }`}
      >
        <ul className="grid">
          {LINKS.map((l, i) => {
            const active = isActive(l.href);
            return (
              <li key={l.href} className="border-b border-white/10">
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  tabIndex={open ? 0 : -1}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center justify-between rounded-none px-4 py-4 text-lg font-extrabold uppercase tracking-wider transition-[background-color,color,transform] duration-100 ${SNAP} active:scale-[0.98] ${
                    active
                      ? "bg-[#E53E3E] text-white"
                      : "text-white hover:bg-[#1A1A1A] hover:text-[#ECC94B]"
                  }`}
                >
                  <span>{l.label}</span>
                  <span className="font-mono text-xs tracking-widest text-[#A0AEC0]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          href="/table-availability"
          onClick={() => setOpen(false)}
          tabIndex={open ? 0 : -1}
          className={`block rounded-none bg-[#ECC94B] px-4 py-4 text-center font-mono text-sm font-extrabold uppercase tracking-widest text-black transition-[background-color,color,transform] duration-100 ${SNAP} hover:bg-[#E53E3E] hover:text-white active:scale-95`}
        >
          View Available Tables →
        </Link>
      </nav>
    </header>
  );
}