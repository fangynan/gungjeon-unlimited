import { requireRole } from "@/lib/api/auth";
import { PENCIL_BOOKING_COLUMNS, cast } from "@/lib/api/db";
import { mapSupabaseError } from "@/lib/api/errors";
import { ok, withApi } from "@/lib/api/response";
import type { PencilBooking } from "@/types";

export const dynamic = "force-dynamic";

/** The newest bookings by date. Nothing is ever deleted, so cap the list. */
const BOOKINGS_LIMIT = 500;

/**
 * GET /api/bookings — ADMIN or STAFF.
 * Every pencil booking. The session client is used, so RLS (is_staff_or_admin) decides what is
 * visible; the page splits the list into Upcoming and History.
 */
export const GET = withApi(async () => {
  const { supabase } = await requireRole(["admin", "staff"]);

  const { data, error } = await supabase
    .from("pencil_bookings")
    .select(PENCIL_BOOKING_COLUMNS)
    .order("booking_date", { ascending: false })
    .order("booking_time", { ascending: false })
    .limit(BOOKINGS_LIMIT);
  if (error) throw mapSupabaseError(error);

  return ok(cast<PencilBooking[]>(data ?? []));
});
