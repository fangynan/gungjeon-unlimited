import { requireRole } from "@/lib/api/auth";
import { BATCH_COLUMNS, cast } from "@/lib/api/db";
import { ApiError, mapSupabaseError } from "@/lib/api/errors";
import { created, withApi } from "@/lib/api/response";
import { createBatchSchema, parseBody } from "@/lib/api/validation";
import type { CreateBatchInput, InventoryBatch } from "@/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/inventory/batches — ADMIN or STAFF. Body: CreateBatchInput. The batch starts `active`.
 * The expiration date is not part of the body: the database sets it to the date received (today)
 * plus the ingredient's shelf life (see set_batch_expiration() in 008_ingredient_shelf_life.sql).
 */
export const POST = withApi(async (req: Request) => {
  const { supabase } = await requireRole(["admin", "staff"]);
  const input: CreateBatchInput = await parseBody(req, createBatchSchema);

  // Look the ingredient up first so staff get a clear message instead of a generic database error.
  const { data: ingredient, error: ingredientError } = await supabase
    .from("ingredients")
    .select("id, shelf_life_days")
    .eq("id", input.ingredient_id)
    .maybeSingle();
  if (ingredientError) throw mapSupabaseError(ingredientError);
  if (!ingredient) {
    throw new ApiError(400, "Validation failed: ingredient_id: ingredient not found.");
  }
  if (cast<{ shelf_life_days: number | null }>(ingredient).shelf_life_days === null) {
    throw new ApiError(
      400,
      "This ingredient has no shelf life yet. Ask an admin to set one before adding batches."
    );
  }

  const { data, error } = await supabase.from("inventory_batches").insert(input).select(BATCH_COLUMNS).single();
  if (error) throw mapSupabaseError(error);
  return created(cast<InventoryBatch>(data), "Batch added.");
});
