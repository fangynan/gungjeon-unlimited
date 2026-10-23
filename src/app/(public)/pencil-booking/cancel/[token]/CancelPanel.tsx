// src/app/(public)/pencil-booking/cancel/[token]/CancelPanel.tsx
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { cancelPencilBookingByToken } from "@/actions/pencil-booking";
import type { GuestBookingView } from "@/types";
import BookingFrame from "@/components/booking/BookingFrame";
import BookingSummary from "@/components/booking/BookingSummary";

const SPRING = { type: "spring", stiffness: 300, damping: 25 } as const;
const SNAP = "ease-[cubic-bezier(0.25,1,0.5,1)]";
const FOCUS_RING =
  "outline-hidden focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

const SECONDARY = `inline-flex h-12 items-center justify-center border border-gold/40 px-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-paper transition-[border-color,color,transform] duration-100 ${SNAP} hover:border-gold hover:text-gold active:scale-95 ${FOCUS_RING}`;

interface Props {
  token: string;
  booking: GuestBookingView;
}

/**
 * Cancellation happens ONLY from the button's click handler (a server action call).
 * Nothing runs on mount, so email link scanners and previewers that merely load the page
 * can never cancel a booking.
 */
export default function CancelPanel({ token, booking }: Props) {
  const [pending, startTransition] = useTransition();
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (cancelled) doneRef.current?.focus();
  }, [cancelled]);

  function confirmCancellation() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelPencilBookingByToken(token);
      if (result.success) setCancelled(true);
      else setError(result.error);
    });
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        {cancelled ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={SPRING}
          >
            <BookingFrame>
              <div role="status" className="space-y-6 text-center">
                <h2
                  ref={doneRef}
                  tabIndex={-1}
                  className="font-serif-display text-3xl leading-tight text-paper outline-hidden"
                >
                  Booking <span className="text-gold">cancelled</span>
                </h2>
                <p className="text-pretty leading-8 text-paper/75">
                  Your priority seat for this booking has been released. We have emailed you a confirmation. We hope to see
                  you another time.
                </p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/pencil-booking" className={SECONDARY}>
                    Make a new request
                  </Link>
                  <Link
                    href="/"
                    className={`inline-flex h-12 items-center justify-center px-2 text-[12px] font-medium uppercase tracking-[0.16em] text-paper/70 transition-[color,transform] duration-100 ${SNAP} hover:text-gold active:scale-95 ${FOCUS_RING}`}
                  >
                    Back to home
                  </Link>
                </div>
              </div>
            </BookingFrame>
          </motion.div>
        ) : (
          <motion.div key="confirm" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={SPRING}>
            <BookingFrame>
              <div className="space-y-6">
                <p className="text-pretty text-center leading-8 text-paper/75">
                  You are about to cancel the booking below. This releases your priority seat and cannot be undone, but you
                  are always welcome to make a new request.
                </p>

                <BookingSummary
                  name={booking.guest_name}
                  date={booking.booking_date}
                  time={booking.booking_time}
                  partySize={booking.party_size}
                  specialRequests={booking.special_requests}
                />

                <AnimatePresence initial={false}>
                  {error && (
                    <motion.p
                      key="error"
                      role="alert"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={SPRING}
                      className="border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                  <motion.button
                    type="button"
                    onClick={confirmCancellation}
                    disabled={pending}
                    aria-busy={pending}
                    whileHover={pending ? undefined : { scale: 1.02 }}
                    whileTap={pending ? undefined : { scale: 0.97 }}
                    transition={SPRING}
                    className={`inline-flex h-14 items-center justify-center gap-3 bg-gold px-8 text-[13px] font-semibold uppercase tracking-[0.18em] text-ink shadow-[0_0_28px_-8px_rgba(201,164,92,0.7)] disabled:cursor-wait disabled:opacity-80 ${FOCUS_RING}`}
                  >
                    {pending && (
                      <span
                        aria-hidden
                        className="size-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink motion-reduce:animate-none"
                      />
                    )}
                    {pending ? "Cancelling" : "Confirm Cancellation"}
                  </motion.button>
                  <Link href="/" className={SECONDARY}>
                    Keep my booking
                  </Link>
                </div>
              </div>
            </BookingFrame>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
