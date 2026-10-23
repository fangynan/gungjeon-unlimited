// src/app/(public)/pencil-booking/page.tsx
"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Check, Minus, Plus } from "lucide-react";
import { createPencilBooking } from "@/actions/pencil-booking";
import { RESTAURANT } from "@/lib/restaurant-info";
import { serif } from "@/lib/fonts";
import { RESTAURANT_TIME_ZONE, addDays, restaurantToday } from "@/lib/api/dates";
import { BOOKING_RULES, listBookingSlots } from "@/lib/validations/booking";
import { formatBookingTime, restaurantNowMinutes } from "@/lib/booking-format";
import { fadeUp, stagger } from "@/components/home/motion-presets";
import BookingFrame from "@/components/booking/BookingFrame";
import BookingSummary from "@/components/booking/BookingSummary";

/* ───────────────────────── Constants ───────────────────────── */

const SPRING = { type: "spring", stiffness: 300, damping: 25 } as const;
const SNAP = "ease-[cubic-bezier(0.25,1,0.5,1)]";

const FOCUS_RING =
  "outline-hidden focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

const SLOTS = listBookingSlots();

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Field names match the Zod schema keys, so `fieldErrors` from the server maps 1:1. */
type FieldName =
  | "guest_name"
  | "guest_email"
  | "guest_phone"
  | "booking_date"
  | "booking_time"
  | "party_size"
  | "special_requests";

const FIELD_ORDER: readonly FieldName[] = [
  "guest_name",
  "guest_email",
  "guest_phone",
  "booking_date",
  "booking_time",
  "party_size",
  "special_requests",
];

type Values = Record<FieldName, string>;
type Errors = Partial<Record<FieldName, string>>;

const EMPTY: Values = {
  guest_name: "",
  guest_email: "",
  guest_phone: "",
  booking_date: "",
  booking_time: "",
  party_size: "2",
  special_requests: "",
};

interface Submitted {
  bookingId: string;
  values: Values;
}

const isFieldName = (key: string): key is FieldName => (FIELD_ORDER as readonly string[]).includes(key);

const LAST_SEATING = formatBookingTime(BOOKING_RULES.lastSlot);
const FIRST_SEATING = formatBookingTime(BOOKING_RULES.firstSlot);

const STEPS = [
  { title: "Send your pencil booking", body: `Pick a date, a time between ${FIRST_SEATING} and ${LAST_SEATING}, and your party size.` },
  { title: "We note it down", body: "Our team sees your booking right away. We do not send a reply or a confirmation." },
  { title: "Arrive on time", body: `Arrive within ${BOOKING_RULES.graceMinutes} minutes of your booking time. After that, your pencil booking is automatically invalid.` },
] as const;

/* ───────────────────────── Field shell ───────────────────────── */

const inputBase = `block w-full border bg-black/40 px-4 text-base text-paper placeholder:text-paper/35 outline-hidden transition-[border-color,box-shadow] duration-200 ${SNAP} focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/40 disabled:opacity-60`;
const inputBorder = (invalid: boolean) =>
  invalid ? "border-red-400/70" : "border-white/15 hover:border-gold/40";

interface FieldProps {
  name: FieldName;
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
  children: (a11y: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

function Field({ name, label, error, hint, optional, className = "", children }: FieldProps) {
  const uid = useId();
  const id = `${uid}-${name}`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`min-w-0 space-y-2 ${className}`}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-[12px] font-medium uppercase tracking-[0.16em] text-paper/75">
        <span>{label}</span>
        {optional && <span className="text-[11px] normal-case tracking-normal text-paper/45">Optional</span>}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-[13px] leading-6 text-paper/55">
          {hint}
        </p>
      )}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            key="err"
            id={errorId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={SPRING}
            className="text-[13px] font-medium leading-6 text-red-300"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── Pop-up ───────────────────────── */

function BookingPopup({ submitted, onClose }: { submitted: Submitted; onClose: () => void }) {
  const titleId = useId();
  const descId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { values } = submitted;

  useEffect(() => {
    buttonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/75 p-4 sm:items-center"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8 }}
        transition={SPRING}
        className="my-auto w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          // The button is the only focusable element, so keep focus on it.
          if (e.key === "Tab") {
            e.preventDefault();
            buttonRef.current?.focus();
          }
        }}
      >
        <BookingFrame>
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 border border-gold/40 bg-gold/[0.08] px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-gold">
              <span aria-hidden className="inline-block size-1.5 rounded-full bg-gold" />
              Pencil booking saved
            </span>

            <h2 id={titleId} className="text-balance font-serif-display text-3xl leading-tight text-paper">
              See you soon, <span className="text-gold">{values.guest_name.trim().split(" ")[0]}</span>
            </h2>

            <p id={descId} className="text-pretty leading-8 text-paper/80">
              Please note: if you do not arrive within{" "}
              <strong className="font-semibold text-paper">{BOOKING_RULES.graceMinutes} minutes</strong> of your booking
              time, your pencil booking is <strong className="font-semibold text-paper">automatically invalid</strong>.
            </p>

            <BookingSummary
              name={values.guest_name}
              date={values.booking_date}
              time={values.booking_time}
              partySize={values.party_size}
              specialRequests={values.special_requests.trim() || null}
            />

            <button
              ref={buttonRef}
              type="button"
              onClick={onClose}
              className={`inline-flex h-12 w-full items-center justify-center bg-gold px-6 text-[13px] font-semibold uppercase tracking-[0.18em] text-ink transition-transform duration-100 ${SNAP} active:scale-95 ${FOCUS_RING}`}
            >
              Got it
            </button>
          </div>
        </BookingFrame>
      </motion.div>
    </motion.div>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default function PencilBookingPage() {
  const titleId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [focusTick, setFocusTick] = useState(0);

  // Restaurant-local "today" is read after mount so server and client markup match.
  const [today, setToday] = useState<string | null>(null);
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);

  useEffect(() => {
    setToday(restaurantToday());
    setNowMinutes(restaurantNowMinutes(RESTAURANT_TIME_ZONE));
  }, [values.booking_date]);

  const maxDate = today ? addDays(today, BOOKING_RULES.maxAdvanceDays) : undefined;

  /** Slots that are already inside the minimum-notice window for today. */
  const tooSoon = useMemo(() => {
    if (!today || nowMinutes === null || values.booking_date !== today) return new Set<string>();
    return new Set(SLOTS.filter((s) => toMinutes(s) < nowMinutes + BOOKING_RULES.minLeadMinutes));
  }, [today, nowMinutes, values.booking_date]);

  // If the chosen date makes the chosen time unavailable, clear it rather than submit a doomed request.
  useEffect(() => {
    if (values.booking_time && tooSoon.has(values.booking_time)) {
      setValues((v) => ({ ...v, booking_time: "" }));
    }
  }, [tooSoon, values.booking_time]);

  // Move focus to the first invalid field after the server rejects the form.
  useEffect(() => {
    if (focusTick === 0) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [focusTick]);

  function setField(name: FieldName, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));
    setFormError(null);
  }

  const onText =
    (name: FieldName) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setField(name, e.target.value);

  function stepParty(delta: number) {
    const current = Number(values.party_size) || 0;
    const next = Math.min(BOOKING_RULES.maxPartySize, Math.max(1, current + delta));
    setField("party_size", String(next));
  }

  function onPartyInput(e: ChangeEvent<HTMLInputElement>) {
    setField("party_size", e.target.value.replace(/\D/g, "").slice(0, 2));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const snapshot = { ...values };

    startTransition(async () => {
      const result = await createPencilBooking(formData);

      if (result.success) {
        // Show the pop-up, and clear the form behind it so it cannot be sent twice by accident.
        setSubmitted({ bookingId: result.bookingId, values: snapshot });
        setValues(EMPTY);
        setErrors({});
        formRef.current?.reset();
        return;
      }

      const next: Errors = {};
      let generic: string | null = null;
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (isFieldName(key)) next[key] = messages[0];
        else generic = messages[0] ?? null;
      }
      const hasFieldErrors = Object.keys(next).length > 0;
      setErrors(next);
      setFormError(hasFieldErrors ? "Please check the highlighted fields and try again." : (generic ?? result.error));
      if (hasFieldErrors) setFocusTick((t) => t + 1);
    });
  }

  function closePopup() {
    setSubmitted(null);
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  return (
    <div className={`${serif.variable} min-h-screen bg-ink font-sans text-paper`}>
      <MotionConfig reducedMotion="user">
        {/* ───────── Heading ───────── */}
        <section aria-labelledby={titleId} className="relative overflow-hidden px-6 pb-12 pt-16 text-center sm:px-10 sm:pb-14 sm:pt-20">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 size-[36rem] -translate-x-1/2 rounded-full bg-ember/15 blur-3xl"
          />
          <motion.div variants={stagger(0.1, 0.14)} initial="hidden" animate="show" className="relative mx-auto max-w-3xl space-y-6">
            <motion.p variants={fadeUp} className="text-[12px] font-medium uppercase tracking-[0.3em] text-gold">
              <span lang="ko" className="mr-3 font-serif-display text-base normal-case tracking-normal">
                예약
              </span>
              Pencil Booking
            </motion.p>

            <motion.h1
              id={titleId}
              variants={fadeUp}
              className="text-balance font-serif-display text-[clamp(2.5rem,7vw,4.5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-paper"
            >
              Pencil in <span className="text-gold">your visit</span>
            </motion.h1>

            <motion.div variants={fadeUp} aria-hidden className="flex items-center justify-center gap-3">
              <span className="h-px w-12 bg-gold/40" />
              <span className="size-1.5 rotate-45 bg-gold" />
              <span className="h-px w-12 bg-gold/40" />
            </motion.div>

            <motion.p variants={fadeUp} className="mx-auto max-w-xl text-pretty text-base leading-8 text-paper/75 sm:text-lg">
              Let us know when you plan to visit. A pencil booking is not a fixed table and we do not send a reply: arrive
              on time and our team seats you at an available table.
            </motion.p>
          </motion.div>
        </section>

        {/* ───────── Form ───────── */}
        <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
              {/* How it works */}
              <motion.aside
                variants={fadeUp}
                initial="hidden"
                animate="show"
                aria-labelledby={`${titleId}-how`}
                className="space-y-8 lg:sticky lg:top-28 lg:self-start"
              >
                <h2 id={`${titleId}-how`} className="flex items-center gap-5 font-serif-display text-3xl leading-tight text-paper">
                  How it works
                  <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-gold/40 to-transparent" />
                </h2>

                <ol className="space-y-6">
                  {STEPS.map((step, i) => (
                    <li key={step.title} className="flex gap-5">
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.06] font-serif-display text-lg tabular-nums text-gold"
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-serif-display text-xl leading-snug text-paper">{step.title}</h3>
                        <p className="mt-1 text-pretty leading-7 text-paper/70">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                <ul className="space-y-3 border-t border-gold/15 pt-6 text-sm leading-7 text-paper/65">
                  <li className="flex gap-3">
                    <Check aria-hidden className="mt-1.5 size-4 shrink-0 text-gold" strokeWidth={1.6} />
                    <span>
                      Booking times {FIRST_SEATING} to {LAST_SEATING}, every day, on the hour or half hour.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Check aria-hidden className="mt-1.5 size-4 shrink-0 text-gold" strokeWidth={1.6} />
                    <span>
                      Book at least {BOOKING_RULES.minLeadMinutes} minutes ahead, up to {BOOKING_RULES.maxAdvanceDays} days in advance.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Check aria-hidden className="mt-1.5 size-4 shrink-0 text-gold" strokeWidth={1.6} />
                    <span>
                      Arrive within {BOOKING_RULES.graceMinutes} minutes of your time or the booking is invalid. Parties over{" "}
                      {BOOKING_RULES.maxPartySize}? Please call{" "}
                      <a
                        href={`tel:${RESTAURANT.phoneLink}`}
                        className={`text-gold underline decoration-gold/40 underline-offset-4 tabular-nums hover:decoration-gold ${FOCUS_RING}`}
                      >
                        {RESTAURANT.phone}
                      </a>
                      .
                    </span>
                  </li>
                </ul>
              </motion.aside>

              {/* Form */}
              <motion.div variants={fadeUp} initial="hidden" animate="show">
                <BookingFrame>
                  <form ref={formRef} onSubmit={handleSubmit} noValidate aria-label="Pencil booking form" className="space-y-6">
                    {/* Honeypot: real people never see or reach this field. */}
                    <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
                      <label>
                        Leave this field empty
                        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
                      </label>
                    </div>

                    <AnimatePresence initial={false}>
                      {formError && (
                        <motion.div
                          key="form-error"
                          role="alert"
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={SPRING}
                          className="border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200"
                        >
                          {formError}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <Field name="guest_name" label="Full name" error={errors.guest_name} className="sm:col-span-2">
                        {({ id, describedBy, invalid }) => (
                          <input
                            id={id}
                            name="guest_name"
                            type="text"
                            autoComplete="name"
                            value={values.guest_name}
                            onChange={onText("guest_name")}
                            aria-invalid={invalid}
                            aria-required="true"
                            aria-describedby={describedBy}
                            placeholder="Juan Dela Cruz"
                            className={`${inputBase} h-12 ${inputBorder(invalid)}`}
                          />
                        )}
                      </Field>

                      <Field name="guest_email" label="Email address" error={errors.guest_email} hint="For our records only. We do not send emails.">
                        {({ id, describedBy, invalid }) => (
                          <input
                            id={id}
                            name="guest_email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            autoCapitalize="none"
                            spellCheck={false}
                            value={values.guest_email}
                            onChange={onText("guest_email")}
                            aria-invalid={invalid}
                            aria-required="true"
                            aria-describedby={describedBy}
                            placeholder="you@example.com"
                            className={`${inputBase} h-12 ${inputBorder(invalid)}`}
                          />
                        )}
                      </Field>

                      <Field name="guest_phone" label="Phone number" error={errors.guest_phone} hint="So our team can reach you if needed.">
                        {({ id, describedBy, invalid }) => (
                          <input
                            id={id}
                            name="guest_phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            value={values.guest_phone}
                            onChange={onText("guest_phone")}
                            aria-invalid={invalid}
                            aria-required="true"
                            aria-describedby={describedBy}
                            placeholder="0956 961 7084"
                            className={`${inputBase} h-12 ${inputBorder(invalid)}`}
                          />
                        )}
                      </Field>

                      <Field name="booking_date" label="Date" error={errors.booking_date}>
                        {({ id, describedBy, invalid }) => (
                          <input
                            id={id}
                            name="booking_date"
                            type="date"
                            min={today ?? undefined}
                            max={maxDate}
                            value={values.booking_date}
                            onChange={onText("booking_date")}
                            aria-invalid={invalid}
                            aria-required="true"
                            aria-describedby={describedBy}
                            className={`${inputBase} h-12 [color-scheme:dark] ${inputBorder(invalid)}`}
                          />
                        )}
                      </Field>

                      <Field
                        name="booking_time"
                        label="Time slot"
                        error={errors.booking_time}
                        hint={
                          values.booking_date && values.booking_date === today
                            ? `Slots within ${BOOKING_RULES.minLeadMinutes} minutes are unavailable.`
                            : undefined
                        }
                      >
                        {({ id, describedBy, invalid }) => (
                          <select
                            id={id}
                            name="booking_time"
                            value={values.booking_time}
                            onChange={onText("booking_time")}
                            aria-invalid={invalid}
                            aria-required="true"
                            aria-describedby={describedBy}
                            className={`${inputBase} h-12 appearance-none bg-[length:1rem] bg-[right_1rem_center] bg-no-repeat pr-10 [color-scheme:dark] ${inputBorder(invalid)}`}
                            style={{
                              backgroundImage:
                                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c9a45c' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                            }}
                          >
                            <option value="">Choose a time</option>
                            {SLOTS.map((slot) => (
                              <option key={slot} value={slot} disabled={tooSoon.has(slot)}>
                                {formatBookingTime(slot)}
                              </option>
                            ))}
                          </select>
                        )}
                      </Field>

                      <Field
                        name="party_size"
                        label="Party size"
                        error={errors.party_size}
                        hint={`1 to ${BOOKING_RULES.maxPartySize} guests, including children.`}
                        className="sm:col-span-2"
                      >
                        {({ id, describedBy, invalid }) => (
                          <div className="flex h-12 w-full max-w-xs items-stretch">
                            <motion.button
                              type="button"
                              onClick={() => stepParty(-1)}
                              disabled={Number(values.party_size) <= 1}
                              whileTap={{ scale: 0.92 }}
                              transition={SPRING}
                              aria-label="Decrease party size"
                              className={`flex w-12 shrink-0 items-center justify-center border border-r-0 bg-black/40 text-gold transition-colors duration-100 hover:bg-gold/10 disabled:opacity-35 ${invalid ? "border-red-400/70" : "border-white/15"} ${FOCUS_RING}`}
                            >
                              <Minus aria-hidden className="size-4" strokeWidth={1.8} />
                            </motion.button>
                            <input
                              id={id}
                              name="party_size"
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              value={values.party_size}
                              onChange={onPartyInput}
                              aria-invalid={invalid}
                              aria-required="true"
                              aria-describedby={describedBy}
                              className={`${inputBase} min-w-0 flex-1 text-center font-serif-display text-xl tabular-nums ${inputBorder(invalid)}`}
                            />
                            <motion.button
                              type="button"
                              onClick={() => stepParty(1)}
                              disabled={Number(values.party_size) >= BOOKING_RULES.maxPartySize}
                              whileTap={{ scale: 0.92 }}
                              transition={SPRING}
                              aria-label="Increase party size"
                              className={`flex w-12 shrink-0 items-center justify-center border border-l-0 bg-black/40 text-gold transition-colors duration-100 hover:bg-gold/10 disabled:opacity-35 ${invalid ? "border-red-400/70" : "border-white/15"} ${FOCUS_RING}`}
                            >
                              <Plus aria-hidden className="size-4" strokeWidth={1.8} />
                            </motion.button>
                          </div>
                        )}
                      </Field>

                      <Field
                        name="special_requests"
                        label="Notes"
                        optional
                        error={errors.special_requests}
                        hint={`${values.special_requests.length}/500. Celebrations, high chairs, allergies, accessibility needs.`}
                        className="sm:col-span-2"
                      >
                        {({ id, describedBy, invalid }) => (
                          <textarea
                            id={id}
                            name="special_requests"
                            rows={4}
                            maxLength={500}
                            value={values.special_requests}
                            onChange={onText("special_requests")}
                            aria-invalid={invalid}
                            aria-describedby={describedBy}
                            className={`${inputBase} resize-y py-3 leading-7 ${inputBorder(invalid)}`}
                          />
                        )}
                      </Field>
                    </div>

                    <div className="space-y-3 pt-2">
                      <motion.button
                        type="submit"
                        disabled={pending}
                        aria-busy={pending}
                        whileHover={pending ? undefined : { scale: 1.015 }}
                        whileTap={pending ? undefined : { scale: 0.97 }}
                        transition={SPRING}
                        className={`relative inline-flex h-14 w-full items-center justify-center gap-3 overflow-hidden bg-gold px-8 text-[13px] font-semibold uppercase tracking-[0.18em] text-ink shadow-[0_0_28px_-8px_rgba(201,164,92,0.7)] disabled:cursor-wait disabled:opacity-80 ${FOCUS_RING}`}
                      >
                        {pending && (
                          <span
                            aria-hidden
                            className="size-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink motion-reduce:animate-none"
                          />
                        )}
                        {pending ? "Sending" : "Pencil in my booking"}
                      </motion.button>
                      <p className="text-center text-[13px] leading-6 text-paper/50">
                        A pencil booking is not a confirmed table. We do not send a reply.
                      </p>
                    </div>
                  </form>
                </BookingFrame>
              </motion.div>
          </div>
        </div>

        <AnimatePresence>{submitted && <BookingPopup key="popup" submitted={submitted} onClose={closePopup} />}</AnimatePresence>
      </MotionConfig>
    </div>
  );
}
