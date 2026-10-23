"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/api/auth";
import { PENCIL_BOOKING_COLUMNS, cast } from "@/lib/api/db";
import { ApiError } from "@/lib/api/errors";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  adminDecisionSchema,
  bookingIdSchema,
  createPencilBookingSchema,
  summariseZodError,
} from "@/lib/validations/booking";
import type { ActionFailure, ActionResult, AdminDecision, BookingStatus, PencilBooking } from "@/types";

// NOTE: a "use server" module may only export async functions. Everything below that is not
// exported is intentionally module-private.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const failure = (error: string, fieldErrors?: Record<string, string[]>): ActionFailure =>
  fieldErrors ? { success: false, error, fieldErrors } : { success: false, error };

interface PgLikeError {
  code?: string;
  message: string;
}

/** Friendly messages for common database errors. */
const DB_ERRORS: Record<string, string> = {
  "42501": "You do not have permission to perform this action.",
  "22P02": "The submitted values are not valid.",
  "23514": "The submitted values are not valid.",
};

/** Turn anything thrown or returned by a failed call into a client-safe failure. Never leaks internals. */
function toFailure(err: unknown): ActionFailure {
  if (err instanceof ApiError) return failure(err.message); // 401 / 403 from requireRole
  const pg = err as Partial<PgLikeError> | null;
  if (pg && typeof pg.code === "string" && DB_ERRORS[pg.code]) return failure(DB_ERRORS[pg.code]);
  console.error("[pencil-booking] unexpected error:", err);
  return failure("Something went wrong. Please try again.");
}

/** FormData -> plain object. Drops File entries; absent fields stay absent so optional fields work. */
function formDataToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) if (typeof value === "string") out[key] = value;
  return out;
}

// ---------------------------------------------------------------------------
// 1. createPencilBooking: public (guest). Service-role client, server-side validation only.
//    Stores the row and nothing else: no email, no reply, no capacity check.
// ---------------------------------------------------------------------------
export async function createPencilBooking(formData: FormData): Promise<ActionResult<{ bookingId: string }>> {
  try {
    const raw = formDataToObject(formData);

    // Honeypot: a hidden field named "website" that humans never fill in.
    if (raw.website && raw.website.trim() !== "") return failure("We could not submit your request. Please try again.");

    const parsed = createPencilBookingSchema.safeParse(raw);
    if (!parsed.success) {
      const { message, fieldErrors } = summariseZodError(parsed.error);
      return failure(message, fieldErrors);
    }
    const v = parsed.data;

    // status is left out on purpose: the database default is UPCOMING.
    const { data, error } = await supabaseAdmin()
      .from("pencil_bookings")
      .insert({
        guest_name: v.guest_name,
        guest_email: v.guest_email,
        guest_phone: v.guest_phone,
        party_size: v.party_size,
        booking_date: v.booking_date,
        booking_time: v.booking_time,
        special_requests: v.special_requests,
      })
      .select("id")
      .single();
    if (error) return toFailure(error);

    revalidatePath("/admin/bookings");
    return { success: true, bookingId: cast<{ id: string }>(data).id };
  } catch (err) {
    return toFailure(err);
  }
}

// ---------------------------------------------------------------------------
// 2. updateBookingStatusAdmin: staff / admin.
//    UPCOMING -> ARRIVED or CANCELLED only. Session client, so RLS (is_staff_or_admin) applies.
// ---------------------------------------------------------------------------
export async function updateBookingStatusAdmin(
  bookingId: string,
  status: AdminDecision,
  staffNotes?: string,
): Promise<ActionResult<{ bookingId: string; status: BookingStatus }>> {
  try {
    const { supabase, profile } = await requireRole(["admin", "staff"]);

    const id = bookingIdSchema.safeParse(bookingId);
    if (!id.success) return failure("Invalid booking id.");
    const decision = adminDecisionSchema.safeParse({ status, staffNotes });
    if (!decision.success) {
      const { message, fieldErrors } = summariseZodError(decision.error);
      return failure(message, fieldErrors);
    }
    const { status: target, staffNotes: notes } = decision.data;

    // One conditional UPDATE: the "still UPCOMING" check and the change are a single atomic
    // statement, so two staff members cannot both act on the same booking.
    // Notes are only written when supplied, so a blank decision never wipes earlier notes.
    const { data, error } = await supabase
      .from("pencil_bookings")
      .update({
        status: target,
        handled_by: profile.id,
        ...(notes !== undefined && { staff_notes: notes === "" ? null : notes }),
      })
      .eq("id", id.data)
      .eq("status", "UPCOMING")
      .select(PENCIL_BOOKING_COLUMNS)
      .maybeSingle();
    if (error) return toFailure(error);

    if (!data) {
      // Nothing updated: unknown id, or the booking is no longer UPCOMING. Say which.
      const { data: current, error: lookupError } = await supabase
        .from("pencil_bookings")
        .select("status")
        .eq("id", id.data)
        .maybeSingle();
      if (lookupError) return toFailure(lookupError);
      if (!current) return failure("Booking not found.");
      const from = cast<{ status: BookingStatus }>(current).status;
      return failure(`This booking is already ${from.toLowerCase()}.`);
    }

    const booking = cast<PencilBooking>(data);
    revalidatePath("/admin/bookings");
    return { success: true, bookingId: booking.id, status: booking.status };
  } catch (err) {
    return toFailure(err);
  }
}
