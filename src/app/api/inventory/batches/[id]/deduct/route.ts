import { requireRole } from "@/lib/api/auth";
import { BATCH_COLUMNS, cast } from "@/lib/api/db";
import { restaurantToday } from "@/lib/api/dates";
import { ApiError, mapSupabaseError } from "@/lib/api/errors";
import { ok, withApi } from "@/lib/api/response";
import { deductBatchSchema, parseBody, parseId } from "@/lib/api/validation";
import type { DeductBatchInput, InventoryBatch } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/inventory/batches/[id]/deduct — ADMIN or STAFF. Body: { quantity }.
 * Removes `quantity` from the batch; at exactly 0 the status becomes `depleted`.
 * The subtraction happens in one SQL statement, so concurrent deductions can't oversell a batch.
 * Expired, depleted, or too-small batches are rejected with 400.
 */
export const PATCH = withApi(async (req: Request, { params }: Ctx) => {
  const { supabase } = await requireRole(["admin", "staff"]);
  const id = parseId((await params).id);
  const { quantity }: DeductBatchInput = await parseBody(req, deductBatchSchema);

  const { data, error } = await supabase.rpc("deduct_inventory_batch", { p_batch_id: id, p_amount: quantity });
  if (error) throw mapSupabaseError(error);

  const batch = cast<InventoryBatch[] | null>(data)?.[0];
  if (batch) return ok(batch, batch.status === "depleted" ? "Batch depleted." : "Quantity deducted.");

  // Zero rows updated: work out why, for a useful message.
  const { data: current, error: lookupError } = await supabase
    .from("inventory_batches")
    .select(BATCH_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (lookupError) throw mapSupabaseError(lookupError);
  if (!current) throw new ApiError(404, "Batch not found.");

  const found = cast<InventoryBatch>(current);
  if (found.status === "depleted") throw new ApiError(400, "Batch is already depleted.");
  if (found.status === "expired" || found.expiration_date < restaurantToday()) {
    throw new ApiError(400, "Batch has expired and cannot be used.");
  }
  throw new ApiError(400, `Insufficient stock: only ${found.quantity} remaining in this batch.`);
});
