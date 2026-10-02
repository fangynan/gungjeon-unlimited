import { requireRole } from "@/lib/api/auth";
import { TABLE_COLUMNS, cast } from "@/lib/api/db";
import { ApiError, mapSupabaseError } from "@/lib/api/errors";
import { ok, withApi } from "@/lib/api/response";
import { parseBody, parseId, updateTableSchema } from "@/lib/api/validation";
import type { DeletedResource, RestaurantTable, UpdateTableInput } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/tables/[id] — ADMIN. Body: UpdateTableInput (partial).
 * Lets admins edit table_number / capacity / location. (Staff use /status instead.)
 */
export const PATCH = withApi(async (req: Request, { params }: Ctx) => {
  const { supabase } = await requireRole(["admin"]);
  const id = parseId((await params).id);
  const input: UpdateTableInput = await parseBody(req, updateTableSchema);

  const { data, error } = await supabase.from("tables").update(input).eq("id", id).select(TABLE_COLUMNS).maybeSingle();
  if (error) throw mapSupabaseError(error);
  if (!data) throw new ApiError(404, "Table not found.");
  return ok(cast<RestaurantTable>(data), "Table updated.");
});

/** DELETE /api/tables/[id] — ADMIN. */
export const DELETE = withApi(async (_req: Request, { params }: Ctx) => {
  const { supabase } = await requireRole(["admin"]);
  const id = parseId((await params).id);

  const { data, error } = await supabase.from("tables").delete().eq("id", id).select("id");
  if (error) throw mapSupabaseError(error);
  if (!data?.length) throw new ApiError(404, "Table not found.");
  return ok<DeletedResource>({ id }, "Table deleted.");
});
