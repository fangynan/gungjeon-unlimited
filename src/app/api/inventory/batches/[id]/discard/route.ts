import { requireRole } from "@/lib/api/auth";
import { BATCH_COLUMNS, cast } from "@/lib/api/db";
import { restaurantToday } from "@/lib/api/dates";
import { ApiError, mapSupabaseError } from "@/lib/api/errors";
import { ok, withApi } from "@/lib/api/response";
import { parseId } from "@/lib/api/validation";
import type { InventoryBatch } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/inventory/batches/[id]/discard — ADMIN or STAFF. No body.
 * Clears an EXPIRED batch (quantity 0, status depleted). The activity log records it as "discarded".
 * Batches that are not expired, or are already cleared, are rejected with 400.
 */
export const POST = withApi(async (_req: Request, { params }: Ctx) => {
  const { supabase } = await requireRole(["admin", "staff"]);
  const id = parseId((await params).id);

  const { data, error } = await supabase.rpc("discard_inventory_batch", { p_batch_id: id });
  if (error) throw mapSupabaseError(error);

  const batch = cast<InventoryBatch[] | null>(data)?.[0];
  if (batch) return ok(batch, "Batch discarded.");

  // Nothing was updated: work out why, for a useful message.
  const { data: current, error: lookupError } = await supabase
    .from("inventory_batches")
    .select(BATCH_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (lookupError) throw mapSupabaseError(lookupError);
  if (!current) throw new ApiError(404, "Batch not found.");

  const found = cast<InventoryBatch>(current);
  if (found.status === "depleted" || found.quantity === 0) {
    throw new ApiError(400, "This batch is already cleared.");
  }
  if (found.expiration_date >= restaurantToday()) {
    throw new ApiError(400, "Only expired batches can be discarded.");
  }
  throw new ApiError(400, "Could not discard this batch.");
});