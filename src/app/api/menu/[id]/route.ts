import { requireRole } from "@/lib/api/auth";
import { MENU_ITEM_COLUMNS, cast } from "@/lib/api/db";
import { ApiError, mapSupabaseError } from "@/lib/api/errors";
import { ok, withApi } from "@/lib/api/response";
import { parseBody, parseId, updateMenuItemSchema } from "@/lib/api/validation";
import type { DeletedResource, MenuItem, UpdateMenuItemInput } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PUT | PATCH /api/menu/[id] — ADMIN. Body: UpdateMenuItemInput (partial; both verbs behave identically). */
const update = withApi(async (req: Request, { params }: Ctx) => {
  const { supabase } = await requireRole(["admin"]);
  const id = parseId((await params).id);
  const input: UpdateMenuItemInput = await parseBody(req, updateMenuItemSchema);

  const { data, error } = await supabase
    .from("menu_items")
    .update(input)
    .eq("id", id)
    .select(MENU_ITEM_COLUMNS)
    .maybeSingle();
  if (error) throw mapSupabaseError(error);
  if (!data) throw new ApiError(404, "Menu item not found.");
  return ok(cast<MenuItem>(data), "Menu item updated.");
});
export const PUT = update;
export const PATCH = update;

/** DELETE /api/menu/[id] — ADMIN. */
export const DELETE = withApi(async (_req: Request, { params }: Ctx) => {
  const { supabase } = await requireRole(["admin"]);
  const id = parseId((await params).id);

  const { data, error } = await supabase.from("menu_items").delete().eq("id", id).select("id");
  if (error) throw mapSupabaseError(error);
  if (!data?.length) throw new ApiError(404, "Menu item not found.");
  return ok<DeletedResource>({ id }, "Menu item deleted.");
});
