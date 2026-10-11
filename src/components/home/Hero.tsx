// src/components/home/Hero.tsx
"use client";

import { motion } from "motion/react";
import { EASE_OUT, fadeUp, stagger } from "./motion-presets";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function Hero() {
  const [logoFailed, setLogoFailed] = useState(false);
const logoRef = useRef<HTMLImageElement>(null);
useEffect(() => {
  const img = logoRef.current;
  if (img && img.complete && img.naturalWidth === 0) setLogoFailed(true);
}, []);

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[calc(100svh-92px)] items-center justify-center overflow-hidden bg-ink"
    >
 {/* HERO BACKGROUND: photo goes in public/images/hero.jpg */}
<div className="absolute inset-0 -z-20">
  <div
    aria-hidden
    className="absolute inset-0 animate-pulse bg-neutral-800 motion-reduce:animate-none"
  />
  <Image
    src="/images/hero_02.jpg"
    alt=""
    fill
    priority
    sizes="100vw"
    className="object-cover"
    onError={(e) => {
      e.currentTarget.style.display = "none";
    }}
  />
</div>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 animate-pulse bg-neutral-800 motion-reduce:animate-none"
      >
        <span className="absolute bottom-24 left-4 font-mono text-[11px] uppercase tracking-widest text-neutral-300 sm:left-6">
          Hero background · drop image here · 1920×1080+
        </span>
      </div>

      {/* Dark overlay: even tint for text contrast, fading into the next section */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/50 to-ink"
      />

      <motion.div
        variants={stagger(0.10, 0.14)}
        initial="hidden"
        animate="show"
        className="mx-auto flex w-full max-w-4xl min-w-0 flex-col items-center px-6 pb-28 pt-16 text-center"
      >
        <motion.p
          variants={fadeUp}
          className="mt-8 max-w-xl text-pretty font-sans text-base leading-8 text-paper/80 sm:text-lg"
        >
        </motion.p>

<motion.h1
  id="hero-heading"
  variants={fadeUp}
  className="mt-6 text-balance font-serif-display text-[clamp(2.5rem,8.5vw,6.5rem)] font-normal leading-[1.02] tracking-[-0.025em] text-paper"
>
  Gather around
  <br className="hidden sm:block" /> <span className="text-gold">the fire.</span>
</motion.h1>

<motion.div variants={fadeUp} aria-hidden className="mt-8 flex items-center gap-3">
  <span className="h-px w-12 bg-gold/50" />
  <span className="size-1.5 rotate-45 bg-gold" />
  <span className="h-px w-12 bg-gold/50" />
</motion.div>

{/* LOGO: put your file at public/images/logo.png (transparent, light or gold) */}
<motion.div
  variants={fadeUp}
  className="relative mb-8 size-20 sm:mb-3 sm:size-24 "
>
  {logoFailed ? (
    <div
      aria-hidden
      className="flex size-full animate-pulse items-center justify-center rounded-full border border-dashed border-gold/60 bg-neutral-800/70 font-mono text-[10px] uppercase tracking-widest text-neutral-300 motion-reduce:animate-none"
    >
      Logo
    </div>
  ) : (
    <Image
      ref={logoRef}
      src="/images/logo.png"
      alt="Gungjeon Unlimited"
      fill
      priority
      sizes="96px"
      className="object-contain"
      onError={() => setLogoFailed(true)}
    />
  )}
</motion.div>
        <motion.div variants={fadeUp} className="flex items-center gap-4 gap-y- ">
  <span
    aria-hidden
    className="hidden h-px w-14 bg-gradient-to-r from-transparent to-gold/70 sm:block"
  />
  <p className="flex items-center gap-3">
    <span lang="ko" className="font-serif-display text-lg text-gold sm:text-xl">
      궁전
    </span>
    <span aria-hidden className="h-3 w-px bg-gold/40" />
    <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-paper/80 sm:text-xs sm:tracking-[0.35em]">
      Gungjeon Unlimited
    </span>
  </p>
  <span
    aria-hidden
    className="hidden h-px w-14 bg-gradient-to-l from-transparent to-gold/70 sm:block"
  />
</motion.div>
      </motion.div>

      {/* Scroll indicator: looping, transform + opacity only */}
      <a
        href="#story"
        aria-label="Scroll down to our story"
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 p-2 text-paper/60 transition-colors duration-100 hover:text-gold"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <span
          aria-hidden
          className="relative block h-12 w-px overflow-hidden bg-paper/20"
        >
          <motion.span
            className="absolute left-0 top-0 block h-5 w-px bg-gold"
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: "240%", opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 1.0,
              ease: EASE_OUT,
              repeat: Infinity,
              repeatDelay: 0.4,
            }}
          />
        </span>
      </a>
    </section>
  );
}
