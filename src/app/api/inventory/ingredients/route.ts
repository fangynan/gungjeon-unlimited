import { requireRole } from "@/lib/api/auth";
import { INGREDIENT_COLUMNS, cast } from "@/lib/api/db";
import { mapSupabaseError } from "@/lib/api/errors";
import { created, ok, withApi } from "@/lib/api/response";
import { createIngredientSchema, parseBody } from "@/lib/api/validation";
import type { CreateIngredientInput, Ingredient, IngredientWithStock } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/inventory/ingredients — ADMIN or STAFF.
 * Every ingredient with `total_stock` (sum over active, unexpired batches) and `is_low_stock`.
 */
export const GET = withApi(async () => {
  const { supabase } = await requireRole(["admin", "staff"]);

  const { data, error } = await supabase.rpc("list_ingredients_with_stock");
  if (error) throw mapSupabaseError(error);
  return ok(cast<IngredientWithStock[]>(data ?? []));
});

/** POST /api/inventory/ingredients — ADMIN. Body: CreateIngredientInput. */
export const POST = withApi(async (req: Request) => {
  const { supabase } = await requireRole(["admin"]);
  const input: CreateIngredientInput = await parseBody(req, createIngredientSchema);

  const { data, error } = await supabase.from("ingredients").insert(input).select(INGREDIENT_COLUMNS).single();
  if (error) throw mapSupabaseError(error);
  return created(cast<Ingredient>(data), "Ingredient created.");
});
