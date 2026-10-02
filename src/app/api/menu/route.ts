import { requireRole } from "@/lib/api/auth";
import { MENU_ITEM_COLUMNS, cast } from "@/lib/api/db";
import { mapSupabaseError } from "@/lib/api/errors";
import { created, ok, withApi } from "@/lib/api/response";
import { createMenuItemSchema, escapeLike, parseBody } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";
import type { CreateMenuItemInput, MenuItem } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/menu[?category=Pork]   — PUBLIC (no credentials needed; RLS allows anon SELECT)
 * Returns every item, including unavailable ones, so the UI can show availability.
 * `category` is a case-insensitive exact match.
 */
export const GET = withApi(async (req: Request) => {
  const category = new URL(req.url).searchParams.get("category")?.trim();

  const supabase = await createClient();
  let query = supabase.from("menu_items").select(MENU_ITEM_COLUMNS).order("category").order("name");
  if (category) query = query.ilike("category", escapeLike(category));

  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);
  return ok(cast<MenuItem[]>(data ?? []));
});

/** POST /api/menu — ADMIN. Body: CreateMenuItemInput. */
export const POST = withApi(async (req: Request) => {
  const { supabase } = await requireRole(["admin"]); // auth first: 401/403 before 400
  const input: CreateMenuItemInput = await parseBody(req, createMenuItemSchema);

  const { data, error } = await supabase.from("menu_items").insert(input).select(MENU_ITEM_COLUMNS).single();
  if (error) throw mapSupabaseError(error);
  return created(cast<MenuItem>(data), "Menu item created.");
});
