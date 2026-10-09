import { requireRole } from "@/lib/api/auth";
import { cast } from "@/lib/api/db";
import { ApiError, mapSupabaseError } from "@/lib/api/errors";
import { created, withApi } from "@/lib/api/response";
import { parseBody, requestSideDishSchema } from "@/lib/api/validation";
import type { RequestSideDishInput, SideDishRequest } from "@/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/side-dishes/request — ADMIN + STAFF (FR-13). Body: RequestSideDishInput.
 * Logs a request for a 'Side Dishes' menu item (optionally tied to a table) and increments the
 * item's `views_count`, atomically, via the log_side_dish_request() database function.
 * 401 if signed out; 403 if not staff/admin; 404 if the menu item doesn't exist or isn't a side dish;
 * 400 if `table_id` doesn't exist.
 */
export const POST = withApi(async (req: Request) => {
  const { supabase } = await requireRole(["admin", "staff"]);
  const input: RequestSideDishInput = await parseBody(req, requestSideDishSchema);

  const { data, error } = await supabase.rpc("log_side_dish_request", {
    p_menu_item_id: input.menu_item_id,
    p_table_id: input.table_id ?? null,
  });
  if (error) throw mapSupabaseError(error);

  const request = cast<SideDishRequest[] | null>(data)?.[0];
  if (!request) throw new ApiError(404, "Side dish not found.");
  return created(request, "Side dish request logged.");
});