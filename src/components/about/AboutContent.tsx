// src/components/about/AboutContent.tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { MotionConfig, motion, type Variants } from "motion/react";
import { serif, script } from "@/lib/fonts";

/* ───────────── Motion: slow, soft, ease-out. Opacity + transform only. ───────────── */
const GENTLE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const rise: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 1.2, ease: GENTLE } },
};
const photoIn: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 1.4, ease: GENTLE } },
};
const flow = (gap = 0.18, delay = 0.1): Variants => ({
  hidden: {},
  show: { transition: { delayChildren: delay, staggerChildren: gap } },
});
const inView = { once: true, amount: 0.2 } as const;

/* ───────────── Building blocks ───────────── */

/** Placeholder underneath, real photo on top. Missing file => placeholder stays. */
function Photo({
  src,
  alt,
  label,
  sizes,
  className = "",
}: {
  src: string;
  alt: string;
  label: string;
  sizes: string;
  className?: string;
}) {
  return (
    <div className={`relative size-full overflow-hidden bg-neutral-800 ${className}`}>
      <div
        aria-hidden
        className="absolute inset-0 animate-pulse bg-neutral-800 motion-reduce:animate-none"
      >
        <span className="absolute inset-x-4 bottom-4 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
          {label}
        </span>
      </div>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

/** A photo "print" placed at a slight angle; optionally drifts like it is breathing. */
function Frame({
  className,
  rotate = 0,
  drift = 0,
  children,
}: {
  className: string;
  rotate?: number;
  /** seconds of delay for the slow idle drift; 0 = no drift */
  drift?: number;
  children: ReactNode;
}) {
  return (
    <motion.div variants={photoIn} style={{ rotate }} className={className}>
      {drift > 0 ? (
        <motion.div
          className="size-full"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 8, ease: "easeInOut", repeat: Infinity, delay: drift }}
        >
          {children}
        </motion.div>
      ) : (
        children
      )}
    </motion.div>
  );
}

const PRINT = "rounded-3xl shadow-2xl shadow-black/50 ring-1 ring-white/10";
const PRINT_SM = "rounded-2xl shadow-2xl shadow-black/60 ring-4 ring-ink";

function Cluster({ className, children }: { className: string; children: ReactNode }) {
  return (
    <motion.div
      variants={flow(0.25, 0)}
      initial="hidden"
      whileInView="show"
      viewport={inView}
      className={`relative mx-auto w-full max-w-xl ${className}`}
    >
      {children}
    </motion.div>
  );
}

function P({ children }: { children: ReactNode }) {
  return (
    <motion.p variants={rise} className="text-pretty leading-[1.85] text-paper/75">
      {children}
    </motion.p>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-gold/25 bg-white/[0.03] px-4 py-1.5 text-[13px] text-paper/80">
      {children}
    </span>
  );
}

function Ornament() {
  return (
    <div aria-hidden className="flex items-center justify-center gap-3">
      <span className="h-px w-12 bg-gold/40" />
      <span className="size-1.5 rotate-45 bg-gold" />
      <span className="h-px w-12 bg-gold/40" />
    </div>
  );
}

function Copy({
  id,
  eyebrow,
  title,
  offset = "",
  children,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  offset?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      variants={flow(0.2, 0.15)}
      initial="hidden"
      whileInView="show"
      viewport={inView}
      className={`min-w-0 ${offset}`}
    >
      <motion.p
        variants={rise}
        className="text-[12px] font-medium uppercase tracking-[0.3em] text-gold"
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        id={id}
        variants={rise}
        className="mt-5 text-balance font-serif-display text-[clamp(2rem,4.2vw,3.25rem)] font-normal leading-[1.12] tracking-[-0.015em] text-paper"
      >
        {title}
      </motion.h2>
      <div className="mt-7 space-y-5">{children}</div>
    </motion.div>
  );
}

/** Zigzag row. `reverse` puts the photos on the right at desktop widths. */
function StorySection({
  labelledBy,
  media,
  copy,
  reverse = false,
  glow,
}: {
  labelledBy: string;
  media: ReactNode;
  copy: ReactNode;
  reverse?: boolean;
  glow: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className="relative overflow-hidden px-6 py-20 sm:px-10 lg:px-16 lg:py-28"
    >
      <div aria-hidden className={`pointer-events-none absolute size-[34rem] rounded-full blur-3xl ${glow}`} />
      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-12 lg:gap-8">
        <div className={`min-w-0 lg:col-span-6 lg:row-start-1 ${reverse ? "lg:col-start-7" : "lg:col-start-1"}`}>
          {media}
        </div>
        <div className={`min-w-0 lg:col-span-5 lg:row-start-1 ${reverse ? "lg:col-start-1" : "lg:col-start-8"}`}>
          {copy}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Page ───────────── */
export default function AboutContent() {
  return (
    <MotionConfig reducedMotion="user">
      <div className={`${serif.variable} ${script.variable} bg-ink font-sans text-paper`}>
        {/* ── Welcome ── */}
        <section className="relative overflow-hidden px-6 pb-6 pt-20 text-center sm:px-10 lg:pt-28">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 size-[40rem] -translate-x-1/2 rounded-full bg-ember/15 blur-3xl"
          />
          <motion.div
            variants={flow(0.22, 0.1)}
            initial="hidden"
            animate="show"
            className="relative mx-auto flex max-w-3xl flex-col items-center"
          >
            <motion.p
              variants={rise}
              className="text-[12px] font-medium uppercase tracking-[0.3em] text-gold"
            >
              <span lang="ko" className="mr-3 font-serif-display text-base normal-case tracking-normal">
                궁전
              </span>
              Our Story
            </motion.p>
            <motion.h1
              variants={rise}
              className="mt-6 text-balance font-serif-display text-[clamp(2.5rem,7vw,5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-paper"
            >
              Welcome to <span className="text-gold">our table.</span>
            </motion.h1>
            <motion.div variants={rise} className="mt-8">
              <Ornament />
            </motion.div>
            <motion.p
              variants={rise}
              className="mt-8 max-w-xl text-pretty text-base leading-8 text-paper/80 sm:text-lg"
            >
              Gungjeon Unlimited began with a simple wish: to set a Korean table for the
              neighbors we see every day in Valenzuela. Pull up a chair. We saved you a seat.
            </motion.p>
          </motion.div>
        </section>

        {/* ── Our Roots (photos left) ── */}
        <StorySection
          labelledBy="roots-heading"
          glow="-left-48 top-10 bg-ember/10"
          media={
            <Cluster className="pb-14">
              {/* IMAGE: roots main photo → public/images/about/roots-main.jpg */}
              <Frame className="aspect-[4/5] w-[82%]" rotate={-2}>
                <Photo
                  src="/images/about/roots-main.jpg"
                  alt="Our dining room set for a family dinner"
                  label="Roots · main · add /images/about/roots-main.jpg"
                  sizes="(min-width: 1024px) 40vw, 80vw"
                  className={PRINT}
                />
              </Frame>
              {/* IMAGE: roots small photo → public/images/about/roots-detail.jpg */}
              <Frame className="absolute bottom-0 right-0 aspect-square w-[46%]" rotate={4} drift={0.6}>
                <Photo
                  src="/images/about/roots-detail.jpg"
                  alt="A close detail of the table setting"
                  label="Roots · detail · add /images/about/roots-detail.jpg"
                  sizes="(min-width: 1024px) 20vw, 40vw"
                  className={PRINT_SM}
                />
              </Frame>
            </Cluster>
          }
          copy={
            <Copy
              id="roots-heading"
              eyebrow="Our Roots"
              title={
                <>
                  A palace, with the <span className="text-gold">doors left open.</span>
                </>
              }
              offset="lg:mt-12"
            >
              <P>
                Gungjeon (<span lang="ko">궁전</span>) means &ldquo;palace&rdquo; in Korean. We chose
                it because we wanted every guest to feel a little like royalty the moment they walk
                in: welcomed, seated, and looked after.
              </P>
              <P>
                But a palace doesn&rsquo;t have to feel far away. Our wish was an elevated Korean BBQ
                experience that stays friendly to everyone, one that fits a quiet Tuesday dinner as
                comfortably as a birthday. Palasan is our neighborhood, and you are our neighbors.
                This is our way of saying: come as you are.
              </P>
            </Copy>
          }
        />

        {/* ── The Banchan Philosophy (photos right) ── */}
        <StorySection
          labelledBy="banchan-heading"
          reverse
          glow="-right-48 top-0 bg-gold/[0.07]"
          media={
            <Cluster className="pb-12 pt-6">
              {/* IMAGE: banchan main photo → public/images/about/banchan-main.jpg */}
              <Frame className="ml-auto aspect-[5/6] w-[80%]" rotate={2}>
                <Photo
                  src="/images/about/banchan.jpg"
                  alt="A table full of small banchan dishes"
                  label="Banchan · main · add /images/about/banchan-main.jpg"
                  sizes="(min-width: 1024px) 40vw, 80vw"
                  className={PRINT}
                />
              </Frame>
              {/* IMAGE: banchan small photo → public/images/about/banchan-share.jpg */}
              <Frame className="absolute bottom-0 left-0 aspect-[4/5] w-[44%]" rotate={-5} drift={1.2}>
                <Photo
                  src="/images/about/banchan-share.jpg"
                  alt="Friends sharing side dishes at the table"
                  label="Banchan · sharing · add /images/about/banchan-share.jpg"
                  sizes="(min-width: 1024px) 18vw, 40vw"
                  className={PRINT_SM}
                />
              </Frame>
            </Cluster>
          }
          copy={
            <Copy
              id="banchan-heading"
              eyebrow="The Banchan Philosophy"
              title={
                <>
                  The table is never empty. <span className="text-gold">That&rsquo;s the point.</span>
                </>
              }
              offset="lg:-mt-6"
            >
              <P>
                In a Korean home, small dishes reach the table before you&rsquo;ve even asked. Nobody
                counts them. They&rsquo;re there because someone wanted you to feel cared for. That
                is the spirit behind our unlimited banchan.
              </P>
              <P>
                Every refill is our way of saying: stay, share, have more. We would rather see plates
                passed around, a second helping of kimchi, a friendly fight over the last piece of fish
                cake, than a quiet table.
              </P>
              <motion.div variants={rise} className="flex flex-wrap gap-2.5 pt-1">
                {["Kimchi", "Japchae", "Fish cake", "Fluffy egg", "Rice", "and more"].map((d) => (
                  <Pill key={d}>{d}</Pill>
                ))}
              </motion.div>
              <motion.p variants={rise} className="text-sm leading-relaxed text-paper/55">
                Our one gentle ask: take what you&rsquo;ll enjoy, and finish what you take.
              </motion.p>
            </Copy>
          }
        />

        {/* ── The Space & Vibe (photos left) ── */}
        <StorySection
          labelledBy="space-heading"
          glow="-left-40 bottom-0 bg-ember/10"
          media={
            <Cluster className="pb-14 pt-8">
              {/* IMAGE: space main photo → public/images/about/space-main.jpg */}
              <Frame className="aspect-[4/3] w-[88%]" rotate={-1.5}>
                <Photo
                  src="/images/about/space-main.jpg"
                  alt="The dining room in warm, low light"
                  label="Space · main · add /images/about/space-main.jpg"
                  sizes="(min-width: 1024px) 42vw, 85vw"
                  className={PRINT}
                />
              </Frame>
              {/* IMAGE: space friends photo → public/images/about/space-friends.jpg */}
              <Frame className="absolute bottom-0 right-0 aspect-[3/4] w-[40%]" rotate={3.5} drift={0.4}>
                <Photo
                  src="/images/about/space-friends.jpg"
                  alt="Friends laughing around the grill"
                  label="Space · friends · add /images/about/space-friends.jpg"
                  sizes="(min-width: 1024px) 18vw, 40vw"
                  className={PRINT_SM}
                />
              </Frame>
              {/* IMAGE: space detail photo → public/images/about/space-detail.jpg */}
              <Frame className="absolute right-[3%] top-0 aspect-square w-[27%]" rotate={-7} drift={1.6}>
                <Photo
                  src="/images/about/spaceDetail.jpg"
                  alt="Warm lamp light over the table"
                  label="Space · detail · add /images/about/space-detail.jpg"
                  sizes="(min-width: 1024px) 12vw, 28vw"
                  className={PRINT_SM}
                />
              </Frame>
            </Cluster>
          }
          copy={
            <Copy
              id="space-heading"
              eyebrow="The Space & Vibe"
              title={
                <>
                  Low light, warm glow, <span className="text-gold">room to linger.</span>
                </>
              }
              offset="lg:mt-10"
            >
              <P>
                Step inside and the world softens. The room is dark and cozy, modern without being
                cold, lit low so faces glow a little over the grill. It&rsquo;s the kind of place where
                you lose track of time, happily.
              </P>
              <P>
                We shaped it for the moments that matter: a long catch-up with old friends, a
                family&rsquo;s weekend ritual, a birthday that turns into three hours of stories. Come
                hungry, and stay as long as the conversation does.
              </P>
              <motion.div variants={rise} className="flex flex-wrap gap-2.5 pt-1">
                {["Cozy lighting", "Table-side grill", "Made for sharing"].map((d) => (
                  <Pill key={d}>{d}</Pill>
                ))}
              </motion.div>
            </Copy>
          }
        />

        {/* ── Founder's Note ── */}
        <section aria-labelledby="note-heading" className="relative overflow-hidden px-6 py-20 sm:px-10 lg:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.06] blur-3xl"
          />
          <motion.div
            variants={flow(0.2, 0.1)}
            initial="hidden"
            whileInView="show"
            viewport={inView}
            className="relative mx-auto max-w-3xl rounded-3xl border border-gold/15 bg-white/[0.03] px-7 py-12 text-center sm:px-14 sm:py-16"
          >
            <motion.div variants={photoIn} className="mx-auto size-24">
              {/* IMAGE: founder portrait → public/images/about/founder.jpg */}
              <Photo
                src="/images/about/founder.jpg"
                alt="Portrait of the Gungjeon founders"
                label="Photo"
                sizes="96px"
                className="rounded-full ring-2 ring-gold/40"
              />
            </motion.div>

            <motion.p
              variants={rise}
              className="mt-8 text-[12px] font-medium uppercase tracking-[0.3em] text-gold"
            >
              Founder&rsquo;s Note
            </motion.p>
            <motion.h2
              id="note-heading"
              variants={rise}
              className="mt-4 font-serif-display text-3xl font-normal leading-tight text-paper sm:text-4xl"
            >
              A little note from our family
            </motion.h2>

            {/* DRAFT LETTER: rewrite in your own words and add your real names */}
            <motion.div variants={rise} className="mt-8 space-y-5 text-pretty leading-[1.9] text-paper/80">
              <p>
                To everyone who has walked through our door: thank you. When we started Gungjeon, we
                weren&rsquo;t trying to build the fanciest restaurant in Valenzuela. We were trying to
                build a place where our own family would love to gather, and then invite you to join us.
              </p>
              <p>
                If you leave full, happy, and already planning your next visit with the people you love,
                then we&rsquo;ve done what we set out to do. Salamat po, and see you at the table.
              </p>
            </motion.div>

            <motion.div variants={rise} className="mt-10">
              <p
                className="text-4xl leading-none text-gold sm:text-5xl"
                style={{ fontFamily: "var(--font-nanum-pen), cursive" }}
              >
                {/* REPLACE with the founders' real name(s) */}
                &mdash; The Gungjeon Family
              </p>
              <p className="mt-3 text-sm text-paper/55">
                <span lang="ko">많이 드세요!</span> Eat well.
              </p>
            </motion.div>
          </motion.div>
        </section>

      </div>
    </MotionConfig>
  );
}
