// src/app/(public)/page.tsx
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gungjeon Unlimited — Eat All You Can",
  description: "Good food. More choices. Unlimited.",
};

/* ───────────── Motion Engine (single source of truth) ───────────── */
const MOTION = "transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]";

/* ───────────── Types ───────────── */
type HeroLogistic = {
  label: string;
  value: string;
};

/* ───────────── Static Config ───────────── */
const HERO_LOGISTICS: readonly HeroLogistic[] = [
  { label: "Open", value: "10:00 AM - 9:30 PM" },
  { label: "Seatings", value: "Nightly" },
  { label: "Limit", value: "None" },
] as const;

const MARQUEE_ITEMS: readonly string[] = [
  "Eat All You Can",
  "Good Food",
  "More Choices",
  "Unlimited",
  "Night Market",
  "No Limits",
] as const;

/* ───────────── Background Keyframes (scoped to hero) ───────────── */
const HERO_FX = `
  @keyframes gj-grid-drift {
    from { background-position: 0 0, 0 0; }
    to   { background-position: 64px 64px, 64px 64px; }
  }
  @keyframes gj-glow-pulse {
    0%, 100% { opacity: 0.35; transform: translate3d(0, 0, 0) scale(1); }
    50%      { opacity: 0.75; transform: translate3d(4%, -3%, 0) scale(1.12); }
  }
  @keyframes gj-glow-pulse-alt {
    0%, 100% { opacity: 0.2; transform: translate3d(0, 0, 0) scale(1); }
    50%      { opacity: 0.5; transform: translate3d(-5%, 4%, 0) scale(1.18); }
  }
  @keyframes gj-scan {
    0%   { transform: translateY(-10vh); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateY(110vh); opacity: 0; }
  }
  @keyframes gj-marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes gj-flicker {
    0%, 100% { opacity: 1; }
    46% { opacity: 1; }
    48% { opacity: 0.4; }
    50% { opacity: 1; }
    52% { opacity: 0.6; }
    54% { opacity: 1; }
  }
  .gj-grid    { animation: gj-grid-drift 6s linear infinite; }
  .gj-glow-a  { animation: gj-glow-pulse 7s cubic-bezier(0.25, 1, 0.5, 1) infinite; }
  .gj-glow-b  { animation: gj-glow-pulse-alt 9s cubic-bezier(0.25, 1, 0.5, 1) infinite; }
  .gj-scan    { animation: gj-scan 5.5s cubic-bezier(0.25, 1, 0.5, 1) infinite; }
  .gj-marquee { animation: gj-marquee 28s linear infinite; }
  .gj-flicker { animation: gj-flicker 4s steps(1, end) infinite; }
  @media (prefers-reduced-motion: reduce) {
    .gj-grid, .gj-glow-a, .gj-glow-b, .gj-scan, .gj-marquee, .gj-flicker {
      animation: none !important;
    }
  }
`;

export default function PublicHomePage() {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden rounded-none bg-[#000000] text-[#FFFFFF] antialiased selection:bg-red-600 selection:text-[#FFFFFF]">
      <style>{HERO_FX}</style>

      {/* ───────────────────────── HERO ─────────────────────────
          Content is vertically centered with a tight top offset so the
          headline sits right under the fixed PublicHeader
          (`fixed inset-x-0 top-0 z-50`). Bottom padding clears the marquee. */}
      <section
        aria-labelledby="hero-heading"
        className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden rounded-none bg-[#000000] pb-24 pl-5 pr-4 pt-24 md:pb-28 md:pl-14 md:pr-8 md:pt-28 lg:pl-24"
      >
        {/* Drifting grid */}
        <div
          aria-hidden
          className="gj-grid pointer-events-none absolute inset-0 rounded-none opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #FFFFFF 1px, transparent 1px), linear-gradient(to bottom, #FFFFFF 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Crimson glow — top right */}
        <div
          aria-hidden
          className="gj-glow-a pointer-events-none absolute -right-[10%] -top-[15%] h-[70vh] w-[70vh] rounded-none"
          style={{
            background:
              "radial-gradient(closest-side, rgba(229,62,62,0.55), rgba(229,62,62,0) 100%)",
          }}
        />

        {/* Amber glow — bottom left */}
        <div
          aria-hidden
          className="gj-glow-b pointer-events-none absolute -bottom-[20%] left-[5%] h-[60vh] w-[60vh] rounded-none"
          style={{
            background:
              "radial-gradient(closest-side, rgba(236,201,75,0.35), rgba(236,201,75,0) 100%)",
          }}
        />

        {/* Scanline sweep */}
        <div
          aria-hidden
          className="gj-scan pointer-events-none absolute inset-x-0 top-0 h-px rounded-none bg-red-600"
          style={{ boxShadow: "0 0 24px 4px rgba(229,62,62,0.6)" }}
        />

        {/* Crimson edge slab — asymmetric anchor */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-full w-2 rounded-none bg-red-600 md:w-3"
        />

        {/* Amber hairline */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-2 top-0 h-full w-px bg-[#ECC94B]/60 md:left-3"
        />

        <div className="relative z-10 flex flex-col gap-6 md:gap-10">
          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <span className="gj-flicker inline-block h-3 w-3 rounded-none bg-red-600" />
            <span className="font-mono text-xs font-black uppercase tracking-tighter text-[#ECC94B] md:text-sm">
              Gungjeon Unlimited // Night Market
            </span>
          </div>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="max-w-[14ch] text-5xl font-extrabold uppercase leading-[0.9] tracking-wider text-[#FFFFFF] md:text-8xl"
          >
            Eat All
            <br />
            <span className="gj-flicker text-red-600">You Can!</span>
          </h1>

          {/* Sub-headline + CTA — offset right of the headline */}
          <div className="flex flex-col gap-8 md:ml-[8%] md:flex-row md:items-end md:justify-between md:gap-16 lg:ml-[14%]">
            <p className="max-w-xl border-l-4 border-[#ECC94B] pl-4 text-lg font-extrabold uppercase leading-tight tracking-wider text-[#FFFFFF] sm:text-2xl md:pl-6 md:text-3xl">
              Good Food. More Choices.{" "}
              <span className="font-black tracking-tighter text-[#ECC94B]">
                Unlimited.
              </span>
            </p>

            {/* Primary CTA — Action-Button Pattern */}
            <Link
              href="/reservations"
              className={`group relative inline-flex w-full select-none items-center justify-between gap-6 overflow-hidden rounded-none border border-red-600/30 bg-transparent px-6 py-5 text-base font-black uppercase tracking-wider text-[#FFFFFF] ${MOTION} hover:border-red-600 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ECC94B] sm:w-auto sm:px-10 sm:py-6 sm:text-lg`}
            >
              {/* Crimson flash block — slides in instantly on hover */}
              <span
                aria-hidden
                className={`absolute inset-0 -translate-x-full rounded-none bg-red-600 ${MOTION} group-hover:translate-x-0`}
              />
              <span className="relative z-10">Secure a Table</span>
              <span
                aria-hidden
                className={`relative z-10 inline-block ${MOTION} group-hover:translate-x-1.5`}
              >
                →
              </span>
            </Link>
          </div>

          {/* Logistics strip */}
          <dl className="grid grid-cols-3 gap-px rounded-none border border-red-600/30 bg-red-600/30 md:max-w-2xl">
            {HERO_LOGISTICS.map(({ label, value }) => (
              <div
                key={label}
                className="flex flex-col gap-1 rounded-none bg-[#000000]/80 px-3 py-3 md:px-5 md:py-4"
              >
                <dt className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#FFFFFF]/60 md:text-xs">
                  {label}
                </dt>
                <dd className="font-mono text-sm font-black tracking-tighter text-[#ECC94B] md:text-xl">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Night-market marquee ticker */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-1 overflow-hidden rounded-none border-y border-red-600/30 bg-[#000000]/90 py-3"
        >
          <div className="gj-marquee flex w-max whitespace-nowrap">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0 items-center">
                {MARQUEE_ITEMS.map((item) => (
                  <span
                    key={`${dup}-${item}`}
                    className="flex items-center font-mono text-xs font-black uppercase tracking-tighter text-[#ECC94B] md:text-sm"
                  >
                    <span className="px-6 md:px-10">{item}</span>
                    <span className="inline-block h-2 w-2 rounded-none bg-red-600" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom hard rule */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1 rounded-none bg-red-600"
        />
      </section>

      {/* ───────────── PART 2 STARTS HERE ─────────────
          Place the next section directly below the Hero <section>.
          The closing </main> and component brace are already in place. */}
    </main>
  );
}