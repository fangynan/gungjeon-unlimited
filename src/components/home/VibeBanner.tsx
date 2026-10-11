// src/components/home/VibeBanner.tsx
"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { fadeUp, stagger } from "./motion-presets";

export default function VibeBanner() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  // Progress runs from the banner entering the screen to leaving it.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // The background moves slower than the page. Change "12%" for more or less depth.
  const bgY = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <section
      ref={ref}
      aria-labelledby="vibe-heading"
      className="relative isolate flex min-h-[32rem] items-center justify-center overflow-hidden bg-ink px-6 py-24 sm:min-h-[38rem] lg:min-h-[44rem]"
    >
      {/* Parallax layer: taller than the section so it never shows an edge while moving */}
      <motion.div
        aria-hidden
        style={{ y: reduce ? 0 : bgY }}
        className="absolute inset-x-0 -top-[20%] -z-20 h-[140%]"
      >
        {/* BANNER BACKGROUND: photo goes in public/images/vibe-banner.jpg */}
        <div className="absolute inset-0 animate-pulse bg-neutral-800 motion-reduce:animate-none">
          <span className="absolute left-4 top-1/2 font-mono text-[11px] uppercase tracking-widest text-neutral-300 sm:left-6">
            Banner background · add /images/vibe-banner.jpg
          </span>
        </div>
        <Image
          src="/images/vibe-banner.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </motion.div>

      {/* Deep ember tint + fades that blend into the sections above and below */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-black/65" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-br from-ember/40 via-transparent to-black/40"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-ink via-transparent to-ink"
      />

      <motion.div
        variants={stagger(0, 0.14)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="mx-auto flex max-w-3xl min-w-0 flex-col items-center text-center"
      >
        <motion.p
          variants={fadeUp}
          className="text-[12px] font-medium uppercase tracking-[0.3em] text-gold"
        >
          <span lang="ko" className="mr-3 font-serif-display text-base normal-case tracking-normal">
            반찬
          </span>
          Unlimited Banchan
        </motion.p>

        <motion.h2
          id="vibe-heading"
          variants={fadeUp}
          className="mt-6 text-balance font-serif-display text-[clamp(2.25rem,6vw,4.5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-paper"
        >
          The table never <span className="text-gold">goes empty.</span>
        </motion.h2>

        <motion.div variants={fadeUp} aria-hidden className="mt-8 flex items-center gap-3">
          <span className="h-px w-12 bg-gold/50" />
          <span className="size-1.5 rotate-45 bg-gold" />
          <span className="h-px w-12 bg-gold/50" />
        </motion.div>

        {/* DRAFT COPY: edit to match your real banchan lineup */}
        <motion.p
          variants={fadeUp}
          className="mt-8 max-w-xl text-pretty text-base leading-8 text-paper/80 sm:text-lg"
        >
          Small plates arrive first and keep coming. Your only job is to keep
          grilling. Learn how to get the best from every cut.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-10 flex w-full flex-col items-stretch justify-center gap-4 sm:w-auto sm:flex-row"
        >
          {/* NOTE: /grilling-guide does not exist yet and will 404 until built */}
          <Link
            href="/grilling-guide"
            className="inline-flex h-12 items-center justify-center whitespace-nowrap bg-gold px-8 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink transition-[background-color,transform] duration-100 ease-out-quart hover:bg-[#dcb872] active:scale-[0.97]"
          >
            Read the Grilling Guide
          </Link>
          <Link
            href="/table-availability"
            className="inline-flex h-12 items-center justify-center whitespace-nowrap border border-gold/50 px-8 text-[13px] font-semibold uppercase tracking-[0.14em] text-paper transition-[color,border-color,transform] duration-100 ease-out-quart hover:border-gold hover:text-gold active:scale-[0.97]"
          >
            View Table Availability
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
