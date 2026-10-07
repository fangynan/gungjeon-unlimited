import { requireRole } from "@/lib/api/auth";
import { INGREDIENT_COLUMNS, cast } from "@/lib/api/db";
import { ApiError, mapSupabaseError } from "@/lib/api/errors";
import { ok, withApi } from "@/lib/api/response";
import { parseBody, parseId, updateIngredientSchema } from "@/lib/api/validation";
import type { Ingredient, UpdateIngredientInput } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/inventory/ingredients/[id] — ADMIN. Body: UpdateIngredientInput (partial). */
export const PATCH = withApi(async (req: Request, { params }: Ctx) => {
  const { supabase } = await requireRole(["admin"]);
  const id = parseId((await params).id);
  const input: UpdateIngredientInput = await parseBody(req, updateIngredientSchema);

  const { data, error } = await supabase
    .from("ingredients")
    .update(input)
    .eq("id", id)
    .select(INGREDIENT_COLUMNS)
    .maybeSingle();
  if (error) throw mapSupabaseError(error);
  if (!data) throw new ApiError(404, "Ingredient not found.");
  return ok(cast<Ingredient>(data), "Ingredient updated.");
});