/**
 * Pencil Booking types. Safe to import from both server and client code.
 * Mirrors public.pencil_bookings (see supabase/migrations/011_pencil_booking_simple.sql).
 */

/** Stored statuses. "Expired / No-show" is NOT stored: it is computed from date + time + grace. */
export const BOOKING_STATUSES = ["UPCOMING", "ARRIVED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Statuses staff can move an UPCOMING booking to through updateBookingStatusAdmin. */
export const ADMIN_DECISIONS = ["ARRIVED", "CANCELLED"] as const;
export type AdminDecision = (typeof ADMIN_DECISIONS)[number];

/** public.pencil_bookings */
export interface PencilBooking {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  party_size: number;
  /** Restaurant-local calendar date, `YYYY-MM-DD`. */
  booking_date: string;
  /** Restaurant-local wall-clock time, `HH:MM:SS`. */
  booking_time: string;
  status: BookingStatus;
  special_requests: string | null;
  /** Internal only. Never shown to guests. */
  staff_notes: string | null;
  handled_by: string | null;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

/** Server actions never throw to the client; they resolve to one of these. */
export type ActionFailure = {
  success: false;
  error: string;
  /** Per-field messages for form display, keyed by form field name. */
  fieldErrors?: Record<string, string[]>;
};
export type ActionResult<T extends object = Record<never, never>> = ({ success: true } & T) | ActionFailure;
