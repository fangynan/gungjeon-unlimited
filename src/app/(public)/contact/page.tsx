"use client";

import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "motion/react";
import { Clock, MapPin, Phone, Plus, type LucideIcon } from "lucide-react";
import { RESTAURANT } from "@/lib/restaurant-info";
import { serif } from "@/lib/fonts";
import { fadeUp, stagger } from "@/components/home/motion-presets";
import { BOOKING_RULES } from "@/lib/validations/booking";
import { formatBookingTime } from "@/lib/booking-format";

/* ───────────────────────── Data (single source of truth) ───────────────────────── */

const FULL_ADDRESS = `${RESTAURANT.addressLine1}, Valenzuela City`;

const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(FULL_ADDRESS);

// Keyless Google Maps embed (no API key required).
const MAPS_EMBED_URL = `https://maps.google.com/maps?q=${encodeURIComponent(FULL_ADDRESS)}&z=16&output=embed`;

// Typographic en dash instead of the hyphen stored in restaurant-info.
const HOURS_LABEL = RESTAURANT.hours.replace(" - ", " \u2013 ");

const SEATING_HOURS = `${formatBookingTime(BOOKING_RULES.firstSlot)} to ${formatBookingTime(BOOKING_RULES.lastSlot)}`;

// Lets a long email break neatly at the @ instead of mid-word on narrow columns.
const [EMAIL_USER, EMAIL_DOMAIN] = RESTAURANT.email.split("@");

/**
 * Details that cannot be stated without the owner's confirmation.
 * Leave a field undefined to show the safe default copy below; fill it in to override.
 *   landmark  e.g. "Across from the barangay hall, just off M.S. Cruz Street."
 *   parking   e.g. "Free parking for about 6 cars beside the restaurant."
 *   peakHours e.g. "Fridays to Sundays from 6 PM to 9 PM are our busiest."
 */
const VENUE: {
  readonly landmark?: string;
  readonly parking?: string;
  readonly peakHours?: string;
} = {};

/* ───────────────────────── Motion ───────────────────────── */

// Used only by the FAQ accordion (height + chevron). Everything else reuses the
// shared `fadeUp` / `stagger` presets so this page moves like Menu and Home.
const SPRING_FAQ = { type: "spring", stiffness: 250, damping: 22 } as const;

const VIEWPORT = { once: true, amount: 0.15 } as const;

/* ───────────────────────── Shared styles ───────────────────────── */

const FOCUS_RING =
  "outline-hidden focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

/** Understated text link: small caps, gold hairline underline (same voice as Menu tabs). */
const TEXT_LINK = `inline-block border-b border-gold/40 pb-1 text-[12px] font-medium uppercase tracking-[0.16em] text-gold transition-[color,border-color,transform] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:border-gold active:scale-95 ${FOCUS_RING}`;

const INLINE_LINK = `text-gold underline decoration-gold/40 underline-offset-4 transition-colors duration-200 hover:decoration-gold ${FOCUS_RING}`;

// Inverts Google's light map into a warm dark one that sits on the ink background.
const DARK_MAP_STYLE: CSSProperties = {
  filter: "invert(92%) hue-rotate(180deg) grayscale(0.5) sepia(0.2) contrast(0.95)",
};

/* ───────────────────────── Small building blocks ───────────────────────── */

/** Round gold icon badge, same treatment as the House Rules board on the Menu page. */
function IconBadge({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      aria-hidden
      className="flex size-14 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.06] text-gold"
    >
      <Icon className="size-7" strokeWidth={1.4} />
    </span>
  );
}

function PhoneLink() {
  return (
    <a href={`tel:${RESTAURANT.phoneLink}`} className={`${INLINE_LINK} tabular-nums`}>
      {RESTAURANT.phone}
    </a>
  );
}

/** Serif title followed by a fading gold line, as on the Menu category headings. */
function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-5">
      <h2
        id={id}
        className="font-serif-display text-3xl font-normal leading-tight tracking-[-0.01em] text-paper sm:text-4xl"
      >
        {children}
      </h2>
      <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-gold/40 to-transparent" />
    </div>
  );
}

interface RevealSectionProps {
  labelledBy: string;
  className: string;
  children: ReactNode;
}

/** Scroll-triggered fade-up for the lower sections. Plays once. */
function RevealSection({ labelledBy, className, children }: RevealSectionProps) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      aria-labelledby={labelledBy}
      className={className}
    >
      {children}
    </motion.section>
  );
}

interface InfoColumnProps {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}

/** One column of the info board: badge, small-caps label, then the content. */
function InfoColumn({ icon, label, children }: InfoColumnProps) {
  return (
    <li className="flex min-w-0 flex-col items-center gap-4 px-4 py-6 text-center md:py-3">
      <IconBadge icon={icon} />
      <h3 className="text-[12px] font-medium uppercase tracking-[0.16em] text-paper/70">
        {label}
      </h3>
      <div className="flex min-w-0 flex-col items-center gap-3">{children}</div>
    </li>
  );
}

/* ───────────────────────── Part 2 copy ───────────────────────── */

const LANDMARK_COPY: ReactNode =
  VENUE.landmark ??
  "Find us on M.S. Cruz Street in Barangay Palasan, Valenzuela City. The map above drops a pin right at our address, and the Get Directions button opens the route in Google Maps.";

const PARKING_COPY: ReactNode = VENUE.parking ?? (
  <>
    For parking questions, call us on <PhoneLink /> before you travel so you know what to
    expect.
  </>
);

interface ArrivalTip {
  title: string;
  body: ReactNode;
}

const ARRIVAL_TIPS: readonly ArrivalTip[] = [
  { title: "Finding us", body: LANDMARK_COPY },
  { title: "Parking for dine-in guests", body: PARKING_COPY },
];

interface FaqItem {
  id: string;
  question: string;
  answer: ReactNode;
}

const FAQS: readonly FaqItem[] = [
  {
    id: "reservations",
    question: "Do you accept online table reservations?",
    answer: (
      <>
        We do not take fixed table reservations, and walk-ins are always welcome. If you
        would like to skip the wait, you can pencil in a{" "}
        <Link href="/pencil-booking" className={INLINE_LINK}>
          Pencil Booking
        </Link>{" "}
        online. You can also open the{" "}
        <Link href="/table-availability" className={INLINE_LINK}>
          Table Availability
        </Link>{" "}
        page to see which tables are free right now, in real time.
      </>
    ),
  },
  {
    id: "pencil-booking",
    question: "How does a Pencil Booking work?",
    answer: (
      <>
        Send your details on the{" "}
        <Link href="/pencil-booking" className={INLINE_LINK}>
          Pencil Booking
        </Link>{" "}
        page for any half-hour slot from {SEATING_HOURS}, at least {BOOKING_RULES.minLeadMinutes}{" "}
        minutes ahead and up to {BOOKING_RULES.maxAdvanceDays} days in advance. We do not
        send a reply or confirmation, and we do not assign a table in advance: we seat you
        at an available table when you arrive. If you do not arrive within{" "}
        {BOOKING_RULES.graceMinutes} minutes of your booking time, the pencil booking is
        automatically invalid.
      </>
    ),
  },
  {
    id: "location",
    question: "Where are you located in Valenzuela City?",
    answer: (
      <>
        We are at {RESTAURANT.addressLine1}, Valenzuela City. Use the Get Directions link
        at the top of this page, or the map above, to open the route in Google Maps.
      </>
    ),
  },
  {
    id: "peak-hours",
    question: "What are your peak operating hours?",
    answer:
      VENUE.peakHours ??
      `We are open every day from ${HOURS_LABEL}, and the evening is our busiest time. Arriving soon after we open gives you the widest choice of tables, and the Table Availability page shows how full we are before you set out.`,
  },
  {
    id: "parking",
    question: "Is parking available on site?",
    answer: PARKING_COPY,
  },
];

/* ───────────────────────── Part 2 sections ───────────────────────── */

function MapCard() {
  return (
    <div className="relative aspect-[4/3] overflow-hidden border border-white/10 bg-[#0d0c0b] sm:aspect-video">
      <iframe
        title={`Map showing Gungjeon Unlimited at ${FULL_ADDRESS}`}
        src={MAPS_EMBED_URL}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="absolute inset-0 size-full border-0"
        style={DARK_MAP_STYLE}
      />

      {/* Edge blending into the page. Overlays never intercept the pointer, so the map stays draggable. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(11,9,8,0.85)_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/70 to-transparent"
      />

      <p className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 border border-gold/30 bg-ink/80 px-3 py-2 text-[12px] font-medium uppercase tracking-[0.16em] text-gold backdrop-blur-sm sm:left-5 sm:top-5">
        <MapPin aria-hidden className="size-3.5" strokeWidth={1.6} />
        Palasan, Valenzuela City
      </p>

      {/* Keyboard-reachable way out of the embedded map */}
      <a
        href={MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`absolute bottom-4 right-4 border border-gold/30 bg-ink/80 px-3 py-2 text-[12px] font-medium uppercase tracking-[0.16em] text-gold backdrop-blur-sm transition-[color,border-color,transform] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:border-gold active:scale-95 sm:bottom-5 sm:right-5 ${FOCUS_RING}`}
      >
        Open in Google Maps
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </div>
  );
}

function ArrivalGuide() {
  return (
    <div className="grid border border-white/10 bg-[#0d0c0b] lg:grid-cols-2 lg:divide-x lg:divide-gold/15">
      {/* Walk-in guidance */}
      <div className="p-6 sm:p-10">
        <h3 className="font-serif-display text-2xl leading-snug text-paper">
          Walk-ins are <span className="text-gold">always welcome.</span>
        </h3>
        <p className="mt-4 max-w-md text-pretty leading-8 text-paper/75">
          No reservation is needed. Check which tables are free before you leave home, or
          pencil in a booking if you would rather skip the wait.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link href="/table-availability" className={TEXT_LINK}>
            Check Table Availability
          </Link>
          <Link href="/pencil-booking" className={TEXT_LINK}>
            Pencil Booking
          </Link>
        </div>
      </div>

      {/* Practical details */}
      <ul className="divide-y divide-gold/15 border-t border-gold/15 lg:border-t-0">
        {ARRIVAL_TIPS.map(({ title, body }) => (
          <li key={title} className="p-6 sm:p-10">
            <h3 className="font-serif-display text-xl leading-snug text-paper">{title}</h3>
            <p className="mt-3 text-pretty leading-8 text-paper/75">{body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * WAI-ARIA accordion: one panel open at a time.
 * Enter / Space toggle (native button), Arrow Up/Down move between headers (wrapping),
 * Home / End jump to the first / last header.
 */
function FaqAccordion({ items }: { items: readonly FaqItem[] }) {
  const baseId = useId();
  const reduceMotion = useReducedMotion();
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const headerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const heightTransition = reduceMotion ? { duration: 0 } : SPRING_FAQ;

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = items.length - 1;
    let next: number;

    switch (event.key) {
      case "ArrowDown":
        next = index === last ? 0 : index + 1;
        break;
      case "ArrowUp":
        next = index === 0 ? last : index - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return; // Enter / Space fall through to the button's native click.
    }

    event.preventDefault();
    headerRefs.current[next]?.focus();
  }

  return (
    <ul className="divide-y divide-gold/15 border-y border-gold/15">
      {items.map((item, index) => {
        const isOpen = openId === item.id;
        const buttonId = `${baseId}-trigger-${item.id}`;
        const panelId = `${baseId}-panel-${item.id}`;

        return (
          <motion.li key={item.id} layout="position" transition={{ layout: SPRING_FAQ }}>
            <h3>
              <button
                ref={(el: HTMLButtonElement | null) => {
                  headerRefs.current[index] = el;
                }}
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) =>
                  handleKeyDown(event, index)
                }
                className={`group flex w-full items-center justify-between gap-6 px-2 py-5 text-left outline-hidden transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold ${
                  isOpen ? "text-gold" : "text-paper hover:text-gold"
                }`}
              >
                <span className="font-serif-display text-xl leading-snug">{item.question}</span>
                <motion.span
                  aria-hidden
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={SPRING_FAQ}
                  className="shrink-0 text-gold"
                >
                  <Plus className="size-5" strokeWidth={1.4} />
                </motion.span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: heightTransition,
                    opacity: { duration: reduceMotion ? 0 : 0.2, ease: "easeOut" },
                  }}
                  className="overflow-hidden"
                >
                  <div className="px-2 pb-6 pr-10 text-pretty leading-8 text-paper/75">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        );
      })}
    </ul>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default function ContactPage() {
  const titleId = useId();
  const boardId = useId();
  const mapTitleId = useId();
  const arrivalTitleId = useId();
  const faqTitleId = useId();

  return (
    <div className={`${serif.variable} min-h-screen bg-ink font-sans text-paper`}>
      <MotionConfig reducedMotion="user">
        {/* ───────── Page heading + info board ───────── */}
        <section
          aria-labelledby={titleId}
          className="relative overflow-hidden px-6 pb-14 pt-16 text-center sm:px-10 sm:pb-16 sm:pt-20"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 size-[36rem] -translate-x-1/2 rounded-full bg-ember/15 blur-3xl"
          />

          <motion.div
            variants={stagger(0.1, 0.14)}
            initial="hidden"
            animate="show"
            className="relative mx-auto max-w-3xl space-y-6"
          >
            <motion.p
              variants={fadeUp}
              className="text-[12px] font-medium uppercase tracking-[0.3em] text-gold"
            >
              <span lang="ko" className="mr-3 font-serif-display text-base normal-case tracking-normal">
                오시는 길
              </span>
              Find Us
            </motion.p>

            <motion.h1
              id={titleId}
              variants={fadeUp}
              className="text-balance font-serif-display text-[clamp(2.5rem,7vw,4.5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-paper"
            >
              Visit <span className="text-gold">the Palace</span>
            </motion.h1>

            <motion.div variants={fadeUp} aria-hidden className="flex items-center justify-center gap-3">
              <span className="h-px w-12 bg-gold/40" />
              <span className="size-1.5 rotate-45 bg-gold" />
              <span className="h-px w-12 bg-gold/40" />
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="mx-auto max-w-xl text-pretty text-base leading-8 text-paper/75 sm:text-lg"
            >
              Come hungry and bring your people. We are in Palasan, Valenzuela City, where the
              grills are lit every evening. Here is how to find us, when we are open and who
              to call.
            </motion.p>
          </motion.div>

          {/* Info board: same gold-hairline frame as the House Rules board on the Menu page */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="relative mx-auto mt-14 max-w-5xl bg-gradient-to-br from-gold via-gold/25 to-gold/80 p-px shadow-[0_0_90px_-35px_rgba(201,164,92,0.45)]"
          >
            <div className="bg-[#0e0c0a] px-6 py-8 sm:px-10">
              <div className="flex items-center justify-center gap-4 pb-6">
                <span aria-hidden className="h-px w-10 bg-gradient-to-r from-transparent to-gold/60" />
                <h2
                  id={boardId}
                  className="text-[12px] font-medium uppercase tracking-[0.3em] text-gold"
                >
                  Plan Your Visit
                </h2>
                <span aria-hidden className="h-px w-10 bg-gradient-to-l from-transparent to-gold/60" />
              </div>

              <ul
                aria-labelledby={boardId}
                className="grid divide-y divide-gold/15 md:grid-cols-3 md:divide-x md:divide-y-0"
              >
                {/* Address */}
                <InfoColumn icon={MapPin} label="Find us">
                  <address className="not-italic">
                    <span className="block font-serif-display text-[1.4rem] leading-snug text-paper">
                      {RESTAURANT.addressLine1}
                    </span>
                    <span className="mt-1 block text-sm text-paper/60">{RESTAURANT.addressLine2}</span>
                  </address>
                  <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className={TEXT_LINK}>
                    Get Directions
                    <span className="sr-only"> (opens Google Maps in a new tab)</span>
                  </a>
                </InfoColumn>

                {/* Hours */}
                <InfoColumn icon={Clock} label="Opening hours">
                  <p className="font-serif-display text-[1.65rem] leading-none tabular-nums text-gold">
                    {HOURS_LABEL}
                  </p>
                  <p className="text-sm text-paper/60">Every day</p>
                </InfoColumn>

                {/* Direct contact (read-only: links, no forms) */}
                <InfoColumn icon={Phone} label="Call or write">
                  <a
                    href={`tel:${RESTAURANT.phoneLink}`}
                    className={`font-serif-display text-[1.4rem] leading-snug tabular-nums text-paper transition-colors duration-200 hover:text-gold ${FOCUS_RING}`}
                  >
                    {RESTAURANT.phone}
                  </a>
                  <a
                    href={`mailto:${RESTAURANT.email}`}
                    className={`text-[15px] text-paper/80 transition-colors duration-200 [overflow-wrap:anywhere] hover:text-gold ${FOCUS_RING}`}
                  >
                    {EMAIL_USER}
                    <wbr />@{EMAIL_DOMAIN}
                  </a>
                </InfoColumn>
              </ul>
            </div>
          </motion.div>
        </section>

        {/* ───────── Map ───────── */}
        <RevealSection
          labelledBy={mapTitleId}
          className="mx-auto max-w-6xl space-y-8 px-4 pb-16 sm:px-6 sm:pb-20"
        >
          <SectionHeading id={mapTitleId}>Where we are</SectionHeading>
          <MapCard />
        </RevealSection>

        {/* ───────── Arrival guide ───────── */}
        <RevealSection
          labelledBy={arrivalTitleId}
          className="mx-auto max-w-6xl space-y-8 px-4 pb-16 sm:px-6 sm:pb-20"
        >
          <SectionHeading id={arrivalTitleId}>Arriving at the Palace</SectionHeading>
          <ArrivalGuide />
        </RevealSection>

        {/* ───────── FAQ ───────── */}
        <RevealSection
          labelledBy={faqTitleId}
          className="mx-auto max-w-3xl space-y-8 px-4 pb-24 sm:px-6"
        >
          <SectionHeading id={faqTitleId}>Frequently asked questions</SectionHeading>
          <FaqAccordion items={FAQS} />
        </RevealSection>
      </MotionConfig>
    </div>
  );
}
