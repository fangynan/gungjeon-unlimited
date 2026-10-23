import { z } from "zod";
import { RESTAURANT_TIME_ZONE, addDays, restaurantToday } from "@/lib/api/dates";
import { ADMIN_DECISIONS } from "@/types";

// ---------------------------------------------------------------------------
// Business rules. One place to change them; the booking form can import these too.
// Opening hours are 4 PM – 11 PM (src/lib/restaurant-info.ts), so the last seating is 10 PM.
// ---------------------------------------------------------------------------
export const BOOKING_RULES = {
  maxPartySize: 20, // matches the DB check constraint
  slotMinutes: 30,
  firstSlot: "16:00",
  lastSlot: "22:00",
  /** A booking must be made at least this long before the slot (same-day bookings only). */
  minLeadMinutes: 30,
  maxAdvanceDays: 30,
  /** A pencil booking is automatically invalid this many minutes after its time. */
  graceMinutes: 15,
} as const;

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Minutes since local midnight, right now, in restaurant time. */
function restaurantNowMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: RESTAURANT_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

/** `HH:MM` strings for every bookable slot, e.g. for the form's time <select>. */
export function listBookingSlots(): string[] {
  const out: string[] = [];
  for (let m = toMinutes(BOOKING_RULES.firstSlot); m <= toMinutes(BOOKING_RULES.lastSlot); m += BOOKING_RULES.slotMinutes) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Field schemas
// ---------------------------------------------------------------------------
const isRealCalendarDate = (v: string) => {
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

const guestName = z.string().trim().min(2, "Please enter your name.").max(100, "Name is too long.");

const guestEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(150, "Email is too long.")
  .pipe(z.email("Please enter a valid email address."));

/** Accepts "0956 961 7084", "+63 956-961-7084", "(02) 8123 4567"; stored without punctuation. */
const guestPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-().]/g, ""))
  .pipe(z.string().regex(/^\+?\d{7,15}$/, "Please enter a valid phone number."));

const partySize = z.coerce
  .number({ error: "Please enter the number of guests." })
  .int("Party size must be a whole number.")
  .min(1, "Party size must be at least 1.")
  .max(BOOKING_RULES.maxPartySize, `For parties over ${BOOKING_RULES.maxPartySize}, please call us.`);

const bookingDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date.")
  .refine(isRealCalendarDate, "That date does not exist.");

/** Accepts `HH:MM` or `HH:MM:SS`; always yields `HH:MM:00` (what the `time` column stores). */
const bookingTime = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Please choose a time.")
  .transform((v) => `${v.slice(0, 5)}:00`);

const specialRequests = z
  .string()
  .trim()
  .max(500, "Special requests must be 500 characters or fewer.")
  .optional()
  .transform((v) => (v ? v : null));

// ---------------------------------------------------------------------------
// createPencilBooking
// ---------------------------------------------------------------------------
export const createPencilBookingSchema = z
  .object({
    guest_name: guestName,
    guest_email: guestEmail,
    guest_phone: guestPhone,
    party_size: partySize,
    booking_date: bookingDate,
    booking_time: bookingTime,
    special_requests: specialRequests,
  })
  .superRefine((v, ctx) => {
    // Cross-field rules only make sense once both fields are individually valid.
    const today = restaurantToday();
    const minutes = toMinutes(v.booking_time.slice(0, 5));

    if (v.booking_date < today) {
      ctx.addIssue({ code: "custom", path: ["booking_date"], message: "That date has already passed." });
      return;
    }
    if (v.booking_date > addDays(today, BOOKING_RULES.maxAdvanceDays)) {
      ctx.addIssue({
        code: "custom",
        path: ["booking_date"],
        message: `We take pencil bookings up to ${BOOKING_RULES.maxAdvanceDays} days ahead.`,
      });
      return;
    }

    const first = toMinutes(BOOKING_RULES.firstSlot);
    const last = toMinutes(BOOKING_RULES.lastSlot);
    if (minutes < first || minutes > last || (minutes - first) % BOOKING_RULES.slotMinutes !== 0) {
      ctx.addIssue({
        code: "custom",
        path: ["booking_time"],
        message: `Choose a time between ${BOOKING_RULES.firstSlot} and ${BOOKING_RULES.lastSlot}, on the hour or half hour.`,
      });
      return;
    }

    if (v.booking_date === today && minutes < restaurantNowMinutes() + BOOKING_RULES.minLeadMinutes) {
      ctx.addIssue({
        code: "custom",
        path: ["booking_time"],
        message: `Please book at least ${BOOKING_RULES.minLeadMinutes} minutes ahead, or just walk in.`,
      });
    }
  });

export type CreatePencilBookingInput = z.infer<typeof createPencilBookingSchema>;

// ---------------------------------------------------------------------------
// Other actions
// ---------------------------------------------------------------------------
/**
 * `z.guid()` (any UUID-shaped string) rather than `z.uuid()`: Zod 4's uuid() enforces RFC 4122
 * version/variant bits, which is stricter than Postgres. This still stops malformed input
 * before it reaches the database (which would answer with a 22P02 error).
 */
export const bookingIdSchema = z.guid("Invalid booking id.");

/** Status change by staff/admin: only ARRIVED or CANCELLED, with an optional internal note. */
export const adminDecisionSchema = z.object({
  status: z.enum(ADMIN_DECISIONS, { error: "Status must be ARRIVED or CANCELLED." }),
  staffNotes: z.string().trim().max(1000, "Staff notes must be 1000 characters or fewer.").optional(),
});
export type AdminDecisionInput = z.infer<typeof adminDecisionSchema>;

/** Collapse Zod issues into `{ fieldName: [messages] }` plus one readable summary line. */
export function summariseZodError(error: z.ZodError): { message: string; fieldErrors: Record<string, string[]> } {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.map(String).join(".") : "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  const first = error.issues[0];
  return { message: first?.message ?? "Please check the form and try again.", fieldErrors };
}
