// src/components/home/BrandStory.tsx
"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  cubicBezier,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { RESTAURANT } from "@/lib/restaurant-info";
import { fadeUp, stagger } from "./motion-presets";
import Image from "next/image";

const FACTS = [
  { title: "Unlimited", detail: "Banchan, refilled as you eat" },
  { title: "Table-side", detail: "Your own grill, your own pace" },
  { title: "Open daily", detail: RESTAURANT.hours },
] as const;

export default function BrandStory() {
  const ref = useRef<HTMLElement>(null);
const reduce = useReducedMotion();

// 0 when the section's top edge enters the bottom of the screen,
// 1 when it reaches 30% from the top. Change "30%" to "10%" for a slower close.
const { scrollYProgress } = useScroll({
  target: ref,
  offset: ["start end", "start 30%"],
});
const ease = { ease: cubicBezier(0.25, 1, 0.5, 1) }; // decelerates as the gate shuts
const leftX = useTransform(scrollYProgress, [0, 1], ["-100%", "0%"], ease);
const rightX = useTransform(scrollYProgress, [0, 1], ["100%", "0%"], ease);
const seam = useTransform(scrollYProgress, [0.85, 1], [0, 1]);
  return (
    <section
     ref={ref}
     id="story"
     aria-labelledby="story-heading"
     className="relative overflow-hidden bg-ink"
    >
      <div className="grid lg:grid-cols-2">
        {/* LEFT: image (50%) */}
        <motion.div
          style={{ x: reduce ? 0 : leftX }}
           className="relative min-h-[26rem] sm:min-h-[34rem] lg:min-h-[44rem]" >

                import Image from "next/image";
                <Image
                  src="/images/banchan-spread.jpg"   // /public/images/banchan-spread.jpg
                  alt="Table set with Korean banchan and a samgyupsal grill"  // describe the real photo
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />

          {/* Inset gold keyline: stays on top of the image once swapped in */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-4 border border-gold/30 sm:inset-6"
          />
        </motion.div>

        {/* RIGHT: story (50%) */}
        <motion.div
          variants={stagger(0, 0.12)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="flex min-w-0 items-center px-6 py-20 sm:px-12 lg:px-16 xl:px-24"
          style={{ x: reduce ? 0 : rightX }}
        >
          <div className="max-w-xl min-w-0">
            <motion.p
              variants={fadeUp}
              className="text-[12px] font-medium uppercase tracking-[0.3em] text-gold"
            >
              Our Story
            </motion.p>

            <motion.h2
              id="story-heading"
              variants={fadeUp}
              className="mt-5 text-balance font-serif-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.015em] text-paper"
            >
              A Korean table, set in Metro&nbsp;Manila.
            </motion.h2>

            {/* DRAFT COPY: replace with your own founding story. */}
            <motion.p
              variants={fadeUp}
              className="mt-6 text-pretty leading-relaxed text-paper/75"
            >
              Gungjeon means &ldquo;palace&rdquo; in Korean, and we wanted every
              table to feel a little like one. From our kitchen in Palasan, Valenzuela, we
              bring the Korean barbecue tradition to Metro Manila: thick cuts of
              pork belly sizzling in front of you, wrapped in lettuce with
              garlic, ssamjang, and kimchi.
            </motion.p>

            <motion.p
              variants={fadeUp}
              className="mt-4 text-pretty leading-relaxed text-paper/75"
            >
              And the banchan never stops. The small side dishes keep coming for
              as long as you&rsquo;re hungry. That&rsquo;s the unlimited part,
              and it&rsquo;s the heart of how we host.
            </motion.p>

            <motion.dl
              variants={fadeUp}
              className="mt-10 grid gap-6 border-t border-gold/20 pt-8 sm:grid-cols-3"
            >
              {FACTS.map((f) => (
                <div key={f.title} className="min-w-0">
                  <dt className="font-serif-display text-lg text-gold">{f.title}</dt>
                  <dd className="mt-1 text-sm leading-snug text-paper/65">{f.detail}</dd>
                </div>
              ))}
            </motion.dl>

            <motion.div variants={fadeUp} className="mt-10">
              <Link
                href="/about"
                className="group inline-flex items-center gap-2 border-b border-gold/40 pb-1 text-[13px] font-semibold uppercase tracking-[0.16em] text-paper transition-[color,border-color,transform] duration-100 ease-out-quart hover:border-gold hover:text-gold active:scale-[0.97]"
              >
                Read the full story
                <span
                  aria-hidden
                  className="transition-transform duration-200 ease-out-quart group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
      <motion.span
      aria-hidden
      style={{ opacity: seam }}
      className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px bg-gradient-to-b from-transparent via-gold/50 to-transparent lg:block"
      />
    </section>
  );
}
