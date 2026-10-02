import { requireRole } from "@/lib/api/auth";
import { BATCH_COLUMNS, cast } from "@/lib/api/db";
import { restaurantToday } from "@/lib/api/dates";
import { ApiError, mapSupabaseError } from "@/lib/api/errors";
import { created, withApi } from "@/lib/api/response";
import { createBatchSchema, parseBody } from "@/lib/api/validation";
import type { CreateBatchInput, InventoryBatch } from "@/types";

export const dynamic = "force-dynamic";

/** POST /api/inventory/batches — ADMIN or STAFF. Body: CreateBatchInput. The batch starts `active`. */
export const POST = withApi(async (req: Request) => {
  const { supabase } = await requireRole(["admin", "staff"]);
  const input: CreateBatchInput = await parseBody(req, createBatchSchema);

  if (input.expiration_date < restaurantToday()) {
    throw new ApiError(400, "Validation failed: expiration_date: batch is already expired.");
  }

  const { data, error } = await supabase.from("inventory_batches").insert(input).select(BATCH_COLUMNS).single();
  if (error) throw mapSupabaseError(error); // unknown ingredient_id -> 400 (foreign key)
  return created(cast<InventoryBatch>(data), "Batch added.");
});
