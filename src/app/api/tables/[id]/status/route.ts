import { requireRole } from "@/lib/api/auth";
import { TABLE_COLUMNS, cast } from "@/lib/api/db";
import { ApiError, mapSupabaseError } from "@/lib/api/errors";
import { ok, withApi } from "@/lib/api/response";
import { parseBody, parseId, updateTableStatusSchema } from "@/lib/api/validation";
import type { RestaurantTable, UpdateTableStatusInput } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/tables/[id]/status — ADMIN or STAFF. Body: { status: "available" | "occupied" }. */
export const PATCH = withApi(async (req: Request, { params }: Ctx) => {
  const { supabase } = await requireRole(["admin", "staff"]);
  const id = parseId((await params).id);
  const { status }: UpdateTableStatusInput = await parseBody(req, updateTableStatusSchema);

  const { data, error } = await supabase
    .from("tables")
    .update({ status })
    .eq("id", id)
    .select(TABLE_COLUMNS)
    .maybeSingle();
  if (error) throw mapSupabaseError(error);
  if (!data) throw new ApiError(404, "Table not found.");
  return ok(cast<RestaurantTable>(data), `Table status set to ${status}.`);
});
