// src/components/home/MenuHighlights.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "motion/react";
import { EASE_OUT, fadeUp, stagger } from "./motion-presets";

type SetItem = {
  name: string;
  /** Price in pesos */
  price: number;
  tag: string;
  /** Each line is shown as "Unli <text>" */
  inclusions: string[];
  /** File lives in /public. Shows the grey placeholder until it exists. */
  image: string;
  alt: string;
};

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const ROYAL: SetItem = {
  name: "Royal Feast",
  price: 699,
  tag: "Premium set",
  inclusions: [
    "Pork, Beef and Grilled Chicken Fillet",
    "Side Dishes",
    "Crabs, Shrimp, Mussels and Squid",
    "Enoki Mushroom",
    "Cajun Mixed Seafood",
    "Buttered Seafood",
    "Salmon Sashimi",
    "Roast Beef",
    "Cheese",
    "Iced Tea",
  ],
  image: "/images/menu/royal-feast.jpg",
  alt: "Royal Feast spread of premium meats, seafood and salmon sashimi",
};

const UNLI: SetItem[] = [
  {
    name: "Unli 549",
    price: 549,
    tag: "Unlimited",
    inclusions: [
      "Pork, Beef and Grilled Chicken Fillet",
      "Side Dishes",
      "Enoki Mushroom",
      "Cheese",
      "Iced Tea",
    ],
    image: "/images/menu/unli-549.jpg",
    alt: "Unli 549 set of pork, beef and chicken with side dishes",
  },
  {
    name: "Unli 399",
    price: 399,
    tag: "Unlimited",
    inclusions: ["Pork and Grilled Chicken Fillet", "Side Dishes"],
    image: "/images/menu/unli-399.jpg",
    alt: "Unli 399 set of pork and chicken with side dishes",
  },
  {
    name: "Unli 299",
    price: 299,
    tag: "Unlimited",
    inclusions: ["Pork", "Side Dishes"],
    image: "/images/menu/unli-299.jpg",
    alt: "Unli 299 set of pork with side dishes",
  },
];

const POLICIES = [
  "No left-over policy",
  "Left-over will be charged ₱1/gram",
  "1 Unli set per table",
];

/* ── Entry animations (opacity + transform only, ease-out) ── */
const royalCard: Variants = {
  hidden: { opacity: 0, y: 36 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: EASE_OUT,
      delayChildren: 0.2,
      staggerChildren: 0.1,
    },
  },
};
const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -28 },
  show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: EASE_OUT } },
};
const detailsStagger = stagger(0, 0.08);
const listStagger = stagger(0, 0.05);

/** Placeholder underneath, real photo on top. Missing file => placeholder stays. */
function SetImage({ item, sizes }: { item: SetItem; sizes: string }) {
  return (
    <>
      {/* SET IMAGE: photo goes at the path in `item.image` (public/images/menu/...) */}
      <div
        aria-hidden
        className="absolute inset-0 animate-pulse bg-neutral-800 motion-reduce:animate-none"
      >
        <span className="absolute bottom-4 left-4 right-4 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
          {item.name} · add {item.image}
        </span>
      </div>
      <Image
        src={item.image}
        alt={item.alt}
        fill
        sizes={sizes}
        className="object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </>
  );
}

function Diamond() {
  return <span aria-hidden className="mt-[0.55em] size-1.5 shrink-0 rotate-45 bg-gold" />;
}

/* ───────────── Royal Feast: wide, premium, image left / details right ───────────── */
function RoyalFeastCard({ item }: { item: SetItem }) {
  return (
    <motion.div
      variants={royalCard}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      // 1px gold gradient frame + soft gold halo
      className="bg-gradient-to-br from-gold via-gold/25 to-gold/80 p-px shadow-[0_0_90px_-30px_rgba(201,164,92,0.45)]"
    >
      <article className="group relative grid overflow-hidden bg-[#0e0c0a] lg:grid-cols-[1fr_1.15fr]">
        {/* Ambient gold glow (static, no animation cost) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-gold/10 blur-3xl"
        />

        {/* LEFT: image */}
        <motion.div
          variants={slideFromLeft}
          className="relative min-h-[22rem] overflow-hidden sm:min-h-[28rem] lg:min-h-[36rem]"
        >
          <div className="absolute inset-0 transition-transform duration-300 ease-out-quart group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
            <SetImage item={item} sizes="(min-width: 1024px) 45vw, 100vw" />
          </div>
          {/* Blend into the details panel */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0e0c0a] via-transparent to-transparent lg:bg-gradient-to-r"
          />
          <span className="absolute left-5 top-5 bg-ink/85 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
            {item.tag}
          </span>
        </motion.div>

        {/* RIGHT: details */}
        <motion.div
          variants={detailsStagger}
          className="relative flex min-w-0 flex-col justify-center px-6 pb-10 pt-4 sm:px-10 lg:px-12 lg:py-14 xl:px-16"
        >
          <motion.p
            variants={fadeUp}
            className="text-[12px] font-medium uppercase tracking-[0.3em] text-gold"
          >
            The Signature Experience
          </motion.p>

          <motion.h3
            variants={fadeUp}
            className="mt-4 break-words font-serif-display text-[clamp(2.25rem,5vw,3.75rem)] font-normal leading-[1.05] tracking-[-0.02em] text-paper"
          >
            {item.name}
          </motion.h3>

          <motion.p
            variants={fadeUp}
            className="mt-3 font-serif-display text-[clamp(2rem,4vw,3rem)] leading-none tabular-nums text-gold"
          >
            {peso.format(item.price)}
          </motion.p>

          <motion.div variants={fadeUp} aria-hidden className="my-7 flex items-center gap-3">
            <span className="h-px w-12 bg-gold/50" />
            <span className="size-1.5 rotate-45 bg-gold" />
            <span className="h-px flex-1 bg-gradient-to-r from-gold/50 to-transparent" />
          </motion.div>

          <motion.ul
            variants={listStagger}
            className="grid gap-x-8 gap-y-3 text-[15px] leading-snug text-paper/85 sm:grid-cols-2"
          >
            {item.inclusions.map((line) => (
              <motion.li key={line} variants={fadeUp} className="flex min-w-0 gap-3">
                <Diamond />
                <span className="min-w-0">
                  <span className="font-medium text-gold">Unli</span> {line}
                </span>
              </motion.li>
            ))}
          </motion.ul>

          <motion.div variants={fadeUp} className="mt-9">
            <Link
              href="/menu"
              className="inline-flex h-12 items-center bg-gold px-8 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink transition-[background-color,transform] duration-100 ease-out-quart hover:bg-[#dcb872] active:scale-[0.97]"
            >
              View Menu
              <span className="sr-only">: {item.name}</span>
            </Link>
          </motion.div>
        </motion.div>
      </article>
    </motion.div>
  );
}

/* ───────────── Unli cards (row 2) ───────────── */
function UnliCard({ item }: { item: SetItem }) {
  return (
    <article className="group flex h-full flex-col border border-white/10 bg-[#111] transition-colors duration-200 ease-out-quart focus-within:border-gold/40 hover:border-gold/40">
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-900">
        <div className="absolute inset-0 transition-transform duration-300 ease-out-quart group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          <SetImage item={item} sizes="(min-width: 768px) 33vw, 100vw" />
        </div>

        <span className="absolute left-4 top-4 bg-ink/80 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-gold">
          {item.tag}
        </span>

        {/* Hover reveal. On touch devices (no hover) it is always visible. */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/85 via-black/40 to-transparent px-5 pb-5 pt-20 transition-[opacity,transform] duration-200 ease-out-quart motion-reduce:transition-none [@media(hover:hover)]:translate-y-2 [@media(hover:hover)]:opacity-0 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100">
          <Link
            href="/menu"
            className="inline-flex h-11 items-center bg-gold px-6 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink transition-[background-color,transform] duration-100 ease-out-quart hover:bg-[#dcb872] active:scale-[0.97]"
          >
            View Menu
            <span className="sr-only">: {item.name}</span>
          </Link>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5 lg:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="min-w-0 break-words font-serif-display text-xl font-normal leading-tight tracking-[-0.01em] text-paper lg:text-2xl">
            {item.name}
          </h3>
          <span className="shrink-0 font-serif-display text-xl tabular-nums text-gold lg:text-2xl">
            {peso.format(item.price)}
          </span>
        </div>

        <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-5 text-sm leading-snug text-paper/75">
          {item.inclusions.map((line) => (
            <li key={line} className="flex min-w-0 gap-3">
              <span aria-hidden className="shrink-0 text-gold">
                ✓
              </span>
              <span className="min-w-0">
                <span className="font-medium text-gold">Unli</span> {line}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export default function MenuHighlights() {
  return (
    <section
      id="menu-highlights"
      aria-labelledby="menu-heading"
      className="relative bg-ink px-6 py-24 sm:px-10 lg:px-16 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <motion.header
          variants={stagger(0, 0.12)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.p
            variants={fadeUp}
            className="text-[12px] font-medium uppercase tracking-[0.3em] text-gold"
          >
            Eat All You Can
          </motion.p>
          <motion.h2
            id="menu-heading"
            variants={fadeUp}
            className="mt-5 text-balance font-serif-display text-[clamp(2rem,4.5vw,3.25rem)] font-normal leading-[1.1] tracking-[-0.015em] text-paper"
          >
            Choose your set
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-5 text-pretty leading-relaxed text-paper/70"
          >
            Pick the set that suits your table. Every set comes with unlimited
            side dishes.
          </motion.p>
        </motion.header>

        {/* Row 1: Royal Feast, full width */}
        <div className="mt-14 lg:mt-20">
          <RoyalFeastCard item={ROYAL} />
        </div>

        {/* Row 2: the three Unli sets */}
        <motion.ul
          variants={stagger(0, 0.12)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-6 grid gap-6 md:grid-cols-3"
        >
          {UNLI.map((item) => (
            <motion.li key={item.name} variants={fadeUp} className="min-w-0">
              <UnliCard item={item} />
            </motion.li>
          ))}
        </motion.ul>

        {/* House policies, from the printed menu */}
        <motion.ul
          variants={stagger(0, 0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.6 }}
          className="mt-12 flex flex-col items-center justify-center gap-3 text-center text-[12px] font-medium uppercase tracking-[0.18em] text-paper/60 sm:flex-row sm:flex-wrap sm:gap-x-10"
        >
          {POLICIES.map((p) => (
            <motion.li key={p} variants={fadeUp} className="flex items-center gap-3">
              <span aria-hidden className="size-1 rotate-45 bg-gold" />
              {p}
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
