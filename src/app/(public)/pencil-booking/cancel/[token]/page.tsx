// src/app/(public)/pencil-booking/cancel/[token]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getPencilBookingByToken } from "@/actions/pencil-booking";
import { RESTAURANT } from "@/lib/restaurant-info";
import { serif } from "@/lib/fonts";
import type { BookingStatus } from "@/types";
import BookingFrame from "@/components/booking/BookingFrame";
import BookingSummary from "@/components/booking/BookingSummary";
import CancelPanel from "./CancelPanel";

// The token is a secret: keep this page out of search results and out of Referer headers.
export const metadata: Metadata = {
  title: "Cancel Priority Seating | Gungjeon Unlimited",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// Always render against the live booking. Rendering this page NEVER changes the booking:
// cancelling only happens when the guest presses the button in <CancelPanel />.
export const dynamic = "force-dynamic";

const FOCUS_RING =
  "outline-hidden focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

const SNAP = "ease-[cubic-bezier(0.25,1,0.5,1)]";

const LINK_BUTTON = `inline-flex h-12 items-center justify-center border border-gold/40 px-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-paper transition-[border-color,color,transform] duration-100 ${SNAP} hover:border-gold hover:text-gold active:scale-95 ${FOCUS_RING}`;

const STATUS_COPY: Record<BookingStatus, string> = {
  PENDING: "This booking is still pending.",
  CONFIRMED: "This booking is confirmed.",
  CANCELLED: "This booking has already been cancelled.",
  SEATED: "This booking has already been seated, so it can no longer be cancelled online.",
  EXPIRED_NO_SHOW: "This booking expired because we did not see you arrive within the grace period.",
  REJECTED: "This booking request was not accepted, so there is nothing to cancel.",
};

function Shell({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className={`${serif.variable} min-h-screen bg-ink font-sans text-paper`}>
      <section className="relative overflow-hidden px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 size-[36rem] -translate-x-1/2 rounded-full bg-ember/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-2xl space-y-8">
          <header className="space-y-5 text-center">
            <p className="text-[12px] font-medium uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
            <h1 className="text-balance font-serif-display text-[clamp(2.25rem,6vw,3.5rem)] font-normal leading-[1.05] tracking-[-0.02em] text-paper">
              {title}
            </h1>
          </header>
          {children}
        </div>
      </section>
    </div>
  );
}

export default async function CancelPencilBookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await getPencilBookingByToken(token);

  // Unknown / malformed token (or a lookup failure): say so without revealing anything else.
  if (!result.success) {
    return (
      <Shell eyebrow="Priority Seating" title="Link not valid">
        <BookingFrame>
          <div role="alert" className="space-y-6 text-center">
            <p className="text-pretty leading-8 text-paper/75">{result.error}</p>
            <p className="text-sm leading-7 text-paper/60">
              Need help? Call us on{" "}
              <a
                href={`tel:${RESTAURANT.phoneLink}`}
                className={`text-gold underline decoration-gold/40 underline-offset-4 tabular-nums hover:decoration-gold ${FOCUS_RING}`}
              >
                {RESTAURANT.phone}
              </a>
              .
            </p>
            <Link href="/pencil-booking" className={LINK_BUTTON}>
              Request priority seating
            </Link>
          </div>
        </BookingFrame>
      </Shell>
    );
  }

  const { booking } = result;
  const cancellable = booking.status === "PENDING" || booking.status === "CONFIRMED";

  if (!cancellable) {
    return (
      <Shell eyebrow="Priority Seating" title="Nothing to cancel">
        <BookingFrame>
          <div className="space-y-6">
            <p role="status" className="text-pretty text-center leading-8 text-paper/75">
              {STATUS_COPY[booking.status]}
            </p>
            <BookingSummary
              name={booking.guest_name}
              date={booking.booking_date}
              time={booking.booking_time}
              partySize={booking.party_size}
              specialRequests={booking.special_requests}
            />
            <div className="flex justify-center">
              <Link href="/pencil-booking" className={LINK_BUTTON}>
                Make a new request
              </Link>
            </div>
          </div>
        </BookingFrame>
      </Shell>
    );
  }

  return (
    <Shell eyebrow="Priority Seating" title="Cancel your booking?">
      <CancelPanel token={token} booking={booking} />
    </Shell>
  );
}
