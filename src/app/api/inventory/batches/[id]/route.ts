import { requireRole } from "@/lib/api/auth";
import { BATCH_COLUMNS, cast } from "@/lib/api/db";
import { restaurantToday } from "@/lib/api/dates";
import { ApiError, mapSupabaseError } from "@/lib/api/errors";
import { ok, withApi } from "@/lib/api/response";
import { parseBody, parseId, updateBatchSchema } from "@/lib/api/validation";
import type { InventoryBatch, UpdateBatchInput } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/inventory/batches/[id] — ADMIN. Body: UpdateBatchInput (partial).
 * Corrects a batch's quantity, received date or expiration date. The status is recalculated:
 * quantity 0 -> depleted, expiration in the past -> expired, otherwise active.
 */
export const PATCH = withApi(async (req: Request, { params }: Ctx) => {
  const { supabase } = await requireRole(["admin"]);
  const id = parseId((await params).id);
  const input: UpdateBatchInput = await parseBody(req, updateBatchSchema);

  const { data: current, error: lookupError } = await supabase
    .from("inventory_batches")
    .select(BATCH_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (lookupError) throw mapSupabaseError(lookupError);
  if (!current) throw new ApiError(404, "Batch not found.");
  const batch = cast<InventoryBatch>(current);

  const quantity = input.quantity ?? batch.quantity;
  const received = input.received_date ?? batch.received_date;
  const expiration = input.expiration_date ?? batch.expiration_date;
  const today = restaurantToday();

  if (received > today) {
    throw new ApiError(400, "Validation failed: received_date: cannot be in the future.");
  }
  if (received > expiration) {
    throw new ApiError(400, "Validation failed: received_date: cannot be after the expiration date.");
  }

  const status = quantity === 0 ? "depleted" : expiration < today ? "expired" : "active";

  const { data, error } = await supabase
    .from("inventory_batches")
    .update({ ...input, status })
    .eq("id", id)
    .select(BATCH_COLUMNS)
    .maybeSingle();
  if (error) throw mapSupabaseError(error);
  if (!data) throw new ApiError(404, "Batch not found.");
  return ok(cast<InventoryBatch>(data), "Batch updated.");
});