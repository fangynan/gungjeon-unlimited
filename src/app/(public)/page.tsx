// src/app/(public)/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import type React from "react";

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

const FLAMES: readonly { h: number; delay: string; dur: string }[] = Array.from(
  { length: 22 },
  (_, i) => ({
    h: 38 + ((i * 37) % 52),
    delay: `-${((i * 0.37) % 2.4).toFixed(2)}s`,
    dur: `${(1.1 + ((i * 13) % 7) / 10).toFixed(2)}s`,
  })
);

const EMBERS: readonly { left: string; delay: string; dur: string; sway: string; amber: boolean }[] =
  Array.from({ length: 16 }, (_, i) => ({
    left: `${(i * 53) % 100}%`,
    delay: `-${((i * 0.71) % 5).toFixed(2)}s`,
    dur: `${(3.8 + ((i * 7) % 5) * 0.6).toFixed(2)}s`,
    sway: `${((i % 2 === 0 ? 1 : -1) * (12 + ((i * 11) % 36))).toString()}px`,
    amber: i % 3 !== 0,
  }));

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
  @keyframes gj-flame {
    0%, 100% { transform: scaleY(0.72) skewX(-4deg); opacity: 0.8; }
    25%      { transform: scaleY(1.05) skewX(5deg);  opacity: 1; }
    50%      { transform: scaleY(0.86) skewX(-2deg); opacity: 0.85; }
    75%      { transform: scaleY(1.16) skewX(3deg);  opacity: 1; }
  }
  @keyframes gj-heat {
    0%, 100% { opacity: 0.55; }
    50%      { opacity: 0.95; }
  }
  @keyframes gj-ember {
    0%   { transform: translate3d(0, 0, 0); opacity: 0; }
    10%  { opacity: 1; }
    100% { transform: translate3d(var(--sway), -75vh, 0); opacity: 0; }
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
  .gj-flame   { transform-origin: 50% 100%; animation: gj-flame var(--dur) cubic-bezier(0.25, 1, 0.5, 1) var(--delay) infinite; will-change: transform, opacity; }
  .gj-heat    { animation: gj-heat 2.2s cubic-bezier(0.25, 1, 0.5, 1) infinite; }
  .gj-ember   { animation: gj-ember var(--dur) cubic-bezier(0.25, 1, 0.5, 1) var(--delay) infinite; will-change: transform, opacity; }
  .gj-marquee { animation: gj-marquee 28s linear infinite; }
  .gj-flicker { animation: gj-flicker 4s steps(1, end) infinite; }
  @media (prefers-reduced-motion: reduce) {
    .gj-grid, .gj-glow-a, .gj-glow-b, .gj-flame, .gj-heat, .gj-ember, .gj-marquee, .gj-flicker {
      animation: none !important;
    }
    .gj-ember { opacity: 0; }
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
        {/* Grill fire — heat glow, flame tongues, embers */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[48vh] overflow-hidden rounded-none"
        >
          {/* Heat bed */}
          <div
            className="gj-heat absolute inset-x-0 bottom-0 h-full rounded-none"
            style={{
              background:
                "linear-gradient(to top, rgba(236,201,75,0.35) 0%, rgba(229,62,62,0.28) 30%, rgba(229,62,62,0) 100%)",
            }}
          />

          {/* Flame tongues */}
          <div
            className="absolute inset-x-0 bottom-10 flex h-[85%] items-end px-2 mix-blend-screen"
            style={{
              WebkitMaskImage: "linear-gradient(to top, #000 55%, transparent 100%)",
              maskImage: "linear-gradient(to top, #000 55%, transparent 100%)",
            }}
          >
            {FLAMES.map((f, i) => (
              <span
                key={i}
                className="gj-flame -mx-[1.2%] block flex-1 rounded-none"
                style={
                  {
                    height: `${f.h}%`,
                    "--dur": f.dur,
                    "--delay": f.delay,
                    clipPath:
                      "polygon(50% 0%, 78% 38%, 100% 100%, 0% 100%, 22% 38%)",
                    background:
                      "linear-gradient(to top, #ECC94B 0%, #E53E3E 55%, rgba(229,62,62,0) 100%)",
                  } as React.CSSProperties
                }
              />
            ))}
          </div>

          {/* Embers */}
          {EMBERS.map((e, i) => (
            <span
              key={i}
              className={`gj-ember absolute bottom-12 block h-[3px] w-[3px] rounded-none ${
                e.amber ? "bg-[#ECC94B]" : "bg-red-600"
              }`}
              style={
                {
                  left: e.left,
                  "--dur": e.dur,
                  "--delay": e.delay,
                  "--sway": e.sway,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

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
              <span className="relative z-10">See the Live Table</span>
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

      {/* ───────────── PART 2 ─────────────
    Replace the "PART 2 STARTS HERE" placeholder comment and everything
    after it (the closing </main>, component brace, and EOF) with this block. */}

      <style>{REVEAL_FX}</style>

      <FeastAtAGlance />
      <HouseRulesBanner />
    </main>
  );
}

/* ───────────── Scroll-Reveal Rigging (CSS-only, no client JS) ───────────── */
const REVEAL_FX = `
  @keyframes gj-reveal {
    from { opacity: 0; transform: translate3d(0, 32px, 0); }
    to   { opacity: 1; transform: translate3d(0, 0, 0); }
  }
  @supports (animation-timeline: view()) {
    .gj-reveal {
      animation: gj-reveal 1s cubic-bezier(0.25, 1, 0.5, 1) both;
      animation-timeline: view();
      animation-range: entry 0% entry 40%;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .gj-reveal { animation: none !important; }
  }
`;

/* ───────────── Types ───────────── */
type PricingTier = {
  price: string;
  name: string;
  blurb: string;
  flagship?: boolean;
};

type HouseRule = {
  code: string;
  title: string;
  detail: string;
};

/* ───────────── Static Config ───────────── */
const ENTRY_TIERS: readonly PricingTier[] = [
  {
    price: "₱299",
    name: "Starter Spread",
    blurb: "Grill basics // rice // house sides",
  },
  {
    price: "₱399",
    name: "Street Classic",
    blurb: "Grill + fried favorites // skewers",
  },
  {
    price: "₱499",
    name: "Night Market",
    blurb: "Full grill // seafood // hot pots",
  },
] as const;

const FLAGSHIP_TIER: PricingTier = {
  price: "₱699",
  name: "Royal Feast",
  blurb: "Every station // premium cuts // zero limits",
  flagship: true,
};

const HOUSE_RULES: readonly HouseRule[] = [
  {
    code: "01",
    title: "No Left-Over Policy",
    detail: "Take what you can finish. Plates are checked before they leave the table.",
  },
  {
    code: "02",
    title: "₱1/Gram Charge",
    detail: "Uneaten food is weighed and billed per gram of waste.",
  },
  {
    code: "03",
    title: "1 Unli Set Per Table",
    detail: "One unlimited set is shared across the whole table, one tier per table.",
  },
] as const;

/* ───────────── Section: Feast at a Glance ───────────── */
function FeastAtAGlance() {
  return (
    <section
      aria-labelledby="feast-heading"
      className={`relative w-full rounded-none bg-[#000000] pb-16 pl-5 pr-4 pt-16 md:pb-28 md:pl-14 md:pr-8 md:pt-28 lg:pl-24 ${MOTION}`}
    >
      {/* Crimson edge slab — continues the hero anchor */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-full w-2 rounded-none bg-red-600 md:w-3"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-2 top-0 h-full w-px bg-[#ECC94B]/60 md:left-3"
      />

      <div className="relative z-10 flex flex-col gap-10 md:gap-14">
        {/* Section header */}
        <div className={`gj-reveal flex flex-col gap-4 ${MOTION}`}>
          <div className="flex items-center gap-3">
            <span className="inline-block h-3 w-3 rounded-none bg-red-600" />
            <span className="font-mono text-xs font-black uppercase tracking-tighter text-[#ECC94B] md:text-sm">
              Menu Board // Tonight
            </span>
          </div>
          <h2
            id="feast-heading"
            className="max-w-[16ch] text-4xl font-extrabold uppercase leading-[0.92] tracking-wider text-[#FFFFFF] md:text-7xl"
          >
            Feast <span className="text-red-600">at a Glance</span>
          </h2>
        </div>

        {/* Asymmetric board: 3 stacked entry rows (7 cols) + flagship slab (5 cols) */}
        <div className="grid grid-cols-1 gap-px rounded-none border border-red-600/30 bg-red-600/30 lg:grid-cols-12">
          <div className="flex flex-col gap-px lg:col-span-7">
            {ENTRY_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`gj-reveal flex flex-1 bg-[#000000] ${MOTION}`}
              >
                <TierLink tier={tier} />
              </div>
            ))}
          </div>

          <div
            className={`gj-reveal flex bg-[#000000] lg:col-span-5 ${MOTION}`}
          >
            <TierLink tier={FLAGSHIP_TIER} />
          </div>
        </div>

        <p className="max-w-xl font-mono text-xs font-black uppercase tracking-tighter text-[#FFFFFF]/60 md:text-sm">
          Tap any tier to see the full spread →
        </p>
      </div>
    </section>
  );
}

/* ───────────── Tier Link — Action-Button Pattern ───────────── */
function TierLink({ tier }: { tier: PricingTier }) {
  const { price, name, blurb, flagship } = tier;

  return (
    <Link
      href="/menu"
      aria-label={`${name} — ${price}. View menu`}
      className={`group relative flex w-full select-none flex-col justify-between gap-8 overflow-hidden rounded-none border border-transparent bg-transparent text-[#FFFFFF] ${MOTION} hover:border-red-600 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#ECC94B] ${
        flagship
          ? "p-6 md:p-10 lg:min-h-[28rem]"
          : "px-6 py-6 md:px-10 md:py-8"
      }`}
    >
      {/* Crimson flash block — slides in on hover */}
      <span
        aria-hidden
        className={`absolute inset-0 -translate-x-full rounded-none bg-red-600 ${MOTION} group-hover:translate-x-0`}
      />

      {flagship && (
        <span className="relative z-10 inline-flex w-fit rounded-none bg-[#ECC94B] px-2 py-1 font-mono text-[10px] font-black uppercase tracking-tighter text-[#000000] md:text-xs">
          Flagship
        </span>
      )}

      <div
        className={`relative z-10 flex gap-4 ${
          flagship
            ? "flex-col"
            : "flex-col sm:flex-row sm:items-end sm:justify-between"
        }`}
      >
        <span
          className={`font-black leading-[0.85] tracking-tighter text-[#ECC94B] ${MOTION} group-hover:text-[#000000] ${
            flagship
              ? "text-8xl md:text-9xl"
              : "text-6xl md:text-8xl"
          }`}
        >
          {price}
        </span>

        <div
          className={`flex flex-col gap-1 ${
            flagship ? "" : "sm:max-w-[16rem] sm:text-right"
          }`}
        >
          <span
            className={`font-extrabold uppercase leading-tight tracking-wider text-[#FFFFFF] ${
              flagship ? "text-2xl md:text-4xl" : "text-lg md:text-2xl"
            }`}
          >
            {name}
          </span>
          <span className="font-mono text-[11px] font-black uppercase tracking-tighter text-[#FFFFFF]/60 group-hover:text-[#FFFFFF] md:text-xs">
            {blurb}
          </span>
        </div>
      </div>

      <span
        aria-hidden
        className={`relative z-10 inline-block font-black text-[#FFFFFF] ${MOTION} group-hover:translate-x-1.5 ${
          flagship ? "text-3xl" : "absolute bottom-4 right-5 text-xl md:bottom-6 md:right-8"
        }`}
      >
        →
      </span>
    </Link>
  );
}

/* ───────────── Section: House Rules Foot-Banner ───────────── */
function HouseRulesBanner() {
  return (
    <section
      aria-labelledby="rules-heading"
      className={`relative w-full rounded-none bg-[#000000] pb-16 pl-5 pr-4 pt-4 md:pb-24 md:pl-14 md:pr-8 lg:pl-24 ${MOTION}`}
    >
      {/* Crimson edge slab */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-full w-2 rounded-none bg-red-600 md:w-3"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-2 top-0 h-full w-px bg-[#ECC94B]/60 md:left-3"
      />

      <div
        className={`gj-reveal relative z-10 rounded-none border border-red-600/30 bg-[#000000] ${MOTION}`}
      >
        {/* Banner header strip */}
        <div className="flex flex-col gap-2 border-b border-red-600/30 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8 md:py-5">
          <h2
            id="rules-heading"
            className="font-mono text-sm font-black uppercase tracking-tighter text-[#ECC94B] md:text-base"
          >
            House Rules // Read Before You Plate
          </h2>
          <span className="font-mono text-[10px] font-black uppercase tracking-tighter text-[#FFFFFF]/60 md:text-xs">
            Applies Nightly // No Exceptions
          </span>
        </div>

        {/* Rules grid */}
        <ul className="grid grid-cols-1 gap-px rounded-none bg-red-600/30 md:grid-cols-3">
          {HOUSE_RULES.map(({ code, title, detail }) => (
            <li
              key={code}
              className={`group flex flex-col gap-6 rounded-none bg-[#000000] px-5 py-6 ${MOTION} hover:bg-red-600/10 md:px-8 md:py-10`}
            >
              <span className="font-mono text-xs font-black tracking-tighter text-red-600 md:text-sm">
                [{code}]
              </span>
              <h3 className="text-2xl font-black uppercase leading-[0.95] tracking-tighter text-[#ECC94B] md:text-4xl">
                {title}
              </h3>
              <p className="font-mono text-xs font-bold uppercase leading-relaxed tracking-tighter text-[#FFFFFF]/70 md:text-sm">
                {detail}
              </p>
            </li>
          ))}
        </ul>

        {/* Banner footer strip */}
        <div className="flex flex-col gap-4 border-t border-red-600/30 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8 md:py-5">
          <span className="font-mono text-[10px] font-black uppercase tracking-tighter text-[#FFFFFF]/60 md:text-xs">
            Questions? Ask any floor staff before you start plating.
          </span>

          <Link
            href="/reservations"
            className={`group relative inline-flex select-none items-center justify-between gap-6 overflow-hidden rounded-none border border-red-600/30 bg-transparent px-6 py-3 text-sm font-black uppercase tracking-wider text-[#FFFFFF] ${MOTION} hover:border-red-600 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ECC94B]`}
          >
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
      </div>
    </section>
  );
}