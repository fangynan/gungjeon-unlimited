import { requireRole } from "@/lib/api/auth";
import { BATCH_COLUMNS, cast } from "@/lib/api/db";
import { daysBetween, restaurantToday } from "@/lib/api/dates";
import { mapSupabaseError } from "@/lib/api/errors";
import { markExpiredBatches } from "@/lib/api/inventory";
import { ok, withApi } from "@/lib/api/response";
import { fefoQuerySchema, parseQuery } from "@/lib/api/validation";
import type { FefoBatch, InventoryBatch } from "@/types";

export const dynamic = "force-dynamic";

type BatchWithIngredient = InventoryBatch & { ingredient: FefoBatch["ingredient"] };

/**
 * GET /api/inventory/fefo[?ingredient_id=<uuid>][&status=active|expired|depleted|all] — ADMIN or STAFF.
 *
 * FEFO order: `expiration_date` ascending, so the batch that must be used first is on top
 * (ties broken by oldest received). Defaults to active batches only. Within each ingredient the
 * first active batch is flagged `use_first`.
 */
export const GET = withApi(async (req: Request) => {
  const { supabase } = await requireRole(["admin", "staff"]);
  const { ingredient_id, status } = parseQuery(new URL(req.url).searchParams, fefoQuerySchema);

  await markExpiredBatches(supabase); // statuses must reflect today's date before we filter on them

  let query = supabase
    .from("inventory_batches")
    .select(`${BATCH_COLUMNS}, ingredient:ingredients(id, name, unit)`)
    .order("expiration_date", { ascending: true })
    .order("created_at", { ascending: true });
  if (status !== "all") query = query.eq("status", status);
  if (ingredient_id) query = query.eq("ingredient_id", ingredient_id);

  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);

  const today = restaurantToday();
  const nextUp = new Set<string>();
  const batches: FefoBatch[] = cast<BatchWithIngredient[]>(data ?? []).map((b) => {
    const isNextUp = b.status === "active" && !nextUp.has(b.ingredient_id);
    if (isNextUp) nextUp.add(b.ingredient_id);
    return { ...b, days_until_expiry: daysBetween(today, b.expiration_date), use_first: isNextUp };
  });
  return ok(batches);
});
