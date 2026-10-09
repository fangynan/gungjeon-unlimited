import { requireRole } from "@/lib/api/auth";
import { cast } from "@/lib/api/db";
import { mapSupabaseError } from "@/lib/api/errors";
import { ok, withApi } from "@/lib/api/response";
import type { SideDishRequestDetail } from "@/types";

export const dynamic = "force-dynamic";

/** How many of the newest requests to return. */
const RECENT_LIMIT = 100;

type Row = {
  id: string;
  menu_item_id: string;
  table_id: string | null;
  requested_at: string;
  menu_items: { name: string } | null;
  tables: { table_number: string } | null;
};

/**
 * GET /api/side-dishes/recent — ADMIN or STAFF (FR-14).
 * The newest recorded side dish requests, with the dish name and the table number (if one was given).
 */
export const GET = withApi(async () => {
  const { supabase } = await requireRole(["admin", "staff"]);

  const { data, error } = await supabase
    .from("side_dish_requests")
    .select("id, menu_item_id, table_id, requested_at, menu_items(name), tables(table_number)")
    .order("requested_at", { ascending: false })
    .limit(RECENT_LIMIT);
  if (error) throw mapSupabaseError(error);

  const rows = cast<Row[]>(data ?? []);
  const result: SideDishRequestDetail[] = rows.map((row) => ({
    id: row.id,
    menu_item_id: row.menu_item_id,
    name: row.menu_items?.name ?? "Unknown item",
    table_id: row.table_id,
    table_number: row.tables?.table_number ?? null,
    requested_at: row.requested_at,
  }));
  return ok(result);
});