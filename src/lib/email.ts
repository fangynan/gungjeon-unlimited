import { RESTAURANT } from "@/lib/restaurant-info";
import { BOOKING_RULES } from "@/lib/validations/booking";
import type { EmailableBooking } from "@/types";

/**
 * Transactional email for Pencil Booking, sent through Resend's REST API with plain `fetch`
 * (no extra dependency).
 *
 * Environment:
 *   RESEND_API_KEY        required in production
 *   EMAIL_FROM            e.g. `Gungjeon Unlimited <bookings@yourdomain.com>` (domain verified in Resend)
 *   NEXT_PUBLIC_SITE_URL  e.g. `https://gungjeon.example` (used to build the cancel link)
 *
 * Every function RESOLVES to `{ sent, error? }` and never throws: by the time an email is sent the
 * database change has already happened, so a mail outage must not turn into a failed booking.
 * Callers log or surface `sent === false` (e.g. so staff know to phone the guest).
 */

export interface EmailResult {
  sent: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** `2026-10-25`, `19:00:00` -> "Sunday, 25 October 2026 at 7:00 PM". No timezone conversion: both are restaurant-local. */
function formatWhen(date: string, time: string): string {
  const day = new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC", // `date` is a calendar date, not an instant; UTC keeps it from shifting a day
  }).format(new Date(`${date}T00:00:00Z`));
  const [h, m] = time.split(":").map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${day} at ${hour12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return raw.replace(/\/+$/, "") || "http://localhost:3000";
}

/**
 * Opens a confirmation page (the guest presses a button there). The link itself must NOT cancel
 * anything on GET: mail scanners and link previewers fetch URLs automatically and would cancel
 * bookings nobody meant to cancel.
 */
const cancelUrl = (b: EmailableBooking) => `${siteUrl()}/pencil-booking/cancel/${b.cancel_token}`;

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------
interface Layout {
  heading: string;
  intro: string;
  booking: EmailableBooking;
  /** Extra paragraphs, already HTML-safe. */
  bodyHtml?: string;
  cta?: { label: string; url: string };
}

const INK = "#0b0908";
const PAPER = "#efe7da";
const GOLD = "#c9a45c";
const EMBER = "#9b1c1c";

function renderHtml({ heading, intro, booking, bodyHtml = "", cta }: Layout): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#6b6258;font-size:14px;white-space:nowrap;vertical-align:top">${label}</td>` +
    `<td style="padding:6px 0;color:${INK};font-size:14px;font-weight:600">${value}</td></tr>`;

  const requests = booking.special_requests
    ? row("Requests", escapeHtml(booking.special_requests).replace(/\n/g, "<br>"))
    : "";

  const button = cta
    ? `<p style="margin:24px 0 0"><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:${EMBER};color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-size:14px;font-weight:600">${escapeHtml(cta.label)}</a></p>`
    : "";

  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:0;background:${PAPER}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:24px 12px"><tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;font-family:Arial,Helvetica,sans-serif">
    <tr><td style="background:${INK};padding:20px 28px;border-bottom:3px solid ${GOLD}">
      <span style="color:${GOLD};font-size:16px;letter-spacing:2px;font-weight:700">${escapeHtml(RESTAURANT.name)}</span>
    </td></tr>
    <tr><td style="padding:28px">
      <h1 style="margin:0 0 12px;font-size:22px;color:${INK}">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#2b2622">Hi ${escapeHtml(booking.guest_name)}, ${intro}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="background:#faf6ef;border-left:3px solid ${GOLD};padding:12px 16px;width:100%">
        ${row("When", escapeHtml(formatWhen(booking.booking_date, booking.booking_time)))}
        ${row("Party size", `${booking.party_size} ${booking.party_size === 1 ? "guest" : "guests"}`)}
        ${requests}
      </table>
      ${bodyHtml}
      ${button}
    </td></tr>
    <tr><td style="padding:18px 28px;background:#faf6ef;font-size:12px;color:#6b6258;line-height:1.6">
      ${escapeHtml(RESTAURANT.addressLine1)}, ${escapeHtml(RESTAURANT.addressLine2)}<br>
      Open ${escapeHtml(RESTAURANT.hours)} &middot; ${escapeHtml(RESTAURANT.phone)}
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

const p = (html: string) => `<p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#2b2622">${html}</p>`;

function renderText(lines: string[]): string {
  return [...lines, "", `${RESTAURANT.name}`, `${RESTAURANT.addressLine1}, ${RESTAURANT.addressLine2}`, `Open ${RESTAURANT.hours} | ${RESTAURANT.phone}`].join("\n");
}

const detailLines = (b: EmailableBooking) => [
  `When: ${formatWhen(b.booking_date, b.booking_time)}`,
  `Party size: ${b.party_size}`,
  ...(b.special_requests ? [`Requests: ${b.special_requests}`] : []),
];

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------
async function sendEmail(args: { to: string; subject: string; html: string; text: string }): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    const reason = "Email is not configured (RESEND_API_KEY / EMAIL_FROM missing).";
    if (process.env.NODE_ENV === "production") {
      console.error(`[email] ${reason} Not sent: "${args.subject}"`);
    } else {
      // Local development: show what would have been sent instead of failing.
      console.warn(`[email] ${reason}\n--- to: ${args.to}\n--- subject: ${args.subject}\n${args.text}\n`);
    }
    return { sent: false, error: reason };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [args.to],
        reply_to: RESTAURANT.email,
        subject: args.subject,
        html: args.html,
        text: args.text,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      console.error(`[email] Resend responded ${res.status}: ${detail}`);
      return { sent: false, error: `Email provider returned ${res.status}.` };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { sent: false, error: "Could not reach the email provider." };
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Guest just submitted a request: it is under review, NOT yet a confirmed table. */
export function sendBookingReceivedEmail(booking: EmailableBooking): Promise<EmailResult> {
  const link = cancelUrl(booking);
  return sendEmail({
    to: booking.guest_email,
    subject: "We received your pencil booking request",
    html: renderHtml({
      heading: "Your request is under review",
      intro: "thank you for your pencil booking request. Our team is reviewing it now and we will email you again as soon as it is confirmed.",
      booking,
      bodyHtml: p("<strong>This is not a confirmed reservation yet.</strong> Please wait for our confirmation email before you set out."),
      cta: { label: "Cancel this request", url: link },
    }),
    text: renderText([
      `Hi ${booking.guest_name},`,
      "",
      "Thank you for your pencil booking request. We are reviewing it and will email you once it is confirmed.",
      "This is NOT a confirmed reservation yet.",
      "",
      ...detailLines(booking),
      "",
      `Need to cancel? ${link}`,
    ]),
  });
}

/** Staff approved the request. States the 15-minute grace policy and carries the cancel link. */
export function sendBookingConfirmationEmail(booking: EmailableBooking): Promise<EmailResult> {
  const grace = BOOKING_RULES.graceMinutes;
  const link = cancelUrl(booking);
  return sendEmail({
    to: booking.guest_email,
    subject: "Your pencil booking is confirmed",
    html: renderHtml({
      heading: "You're confirmed",
      intro: "good news, we have pencilled you in and your priority seating request is confirmed.",
      booking,
      bodyHtml:
        p(`<strong>Arrival policy:</strong> we hold your seats for <strong>${grace} minutes</strong> after your booking time. If you have not arrived within ${grace} minutes, the booking is released and marked as a no-show. When you arrive, tell our host your name and they will seat you.`) +
        p("Plans changed? Please cancel so another guest can have the seats."),
      cta: { label: "Cancel my booking", url: link },
    }),
    text: renderText([
      `Hi ${booking.guest_name},`,
      "",
      "Good news: your pencil booking is CONFIRMED.",
      "",
      ...detailLines(booking),
      "",
      `Arrival policy: we hold your seats for ${grace} minutes after your booking time. After that the booking is released as a no-show.`,
      "",
      `Need to cancel? ${link}`,
    ]),
  });
}

/** The booking was cancelled (by the guest through their link, or by staff). */
export function sendBookingCancellationEmail(booking: EmailableBooking): Promise<EmailResult> {
  return sendEmail({
    to: booking.guest_email,
    subject: "Your pencil booking has been cancelled",
    html: renderHtml({
      heading: "Booking cancelled",
      intro: "your pencil booking has been cancelled. No further action is needed.",
      booking,
      bodyHtml: p(`We would love to see you another time. Walk-ins are always welcome, or call us on ${escapeHtml(RESTAURANT.phone)}.`),
    }),
    text: renderText([
      `Hi ${booking.guest_name},`,
      "",
      "Your pencil booking has been cancelled. No further action is needed.",
      "",
      ...detailLines(booking),
      "",
      `We would love to see you another time. Walk-ins are always welcome, or call ${RESTAURANT.phone}.`,
    ]),
  });
}

/** Staff could not accommodate the request. Staff notes are internal and never included. */
export function sendBookingRejectionEmail(booking: EmailableBooking): Promise<EmailResult> {
  return sendEmail({
    to: booking.guest_email,
    subject: "About your pencil booking request",
    html: renderHtml({
      heading: "We couldn't fit you in",
      intro: "we're sorry, but we are unable to accommodate your pencil booking request for that time because the slot is unavailable.",
      booking,
      bodyHtml: p(`You're welcome to request a different time, walk in during opening hours (${escapeHtml(RESTAURANT.hours)}), or call us on ${escapeHtml(RESTAURANT.phone)} and we will do our best to help.`),
      cta: { label: "Check table availability", url: `${siteUrl()}/table-availability` },
    }),
    text: renderText([
      `Hi ${booking.guest_name},`,
      "",
      "We're sorry, but we are unable to accommodate your pencil booking request because the slot is unavailable.",
      "",
      ...detailLines(booking),
      "",
      `You're welcome to request a different time, walk in (${RESTAURANT.hours}), or call ${RESTAURANT.phone}.`,
      `Table availability: ${siteUrl()}/table-availability`,
    ]),
  });
}
