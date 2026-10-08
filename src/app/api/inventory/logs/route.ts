import { requireRole } from "@/lib/api/auth";
import { LOG_COLUMNS, cast } from "@/lib/api/db";
import { mapSupabaseError } from "@/lib/api/errors";
import { ok, withApi } from "@/lib/api/response";
import type { InventoryLog } from "@/types";

export const dynamic = "force-dynamic";

/** How many of the newest log rows to return. */
const LOG_LIMIT = 100;

/**
 * GET /api/inventory/logs — ADMIN or STAFF.
 *
 * The inventory activity history, newest first: what was added, used or corrected, by whom, and when.
 * The log is written by a database trigger, so it can't be edited or faked from the app.
 */
export const GET = withApi(async () => {
  const { supabase } = await requireRole(["admin", "staff"]);

  const { data, error } = await supabase
    .from("inventory_logs")
    .select(LOG_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(LOG_LIMIT);
  if (error) throw mapSupabaseError(error);

  return ok(cast<InventoryLog[]>(data ?? []));
});