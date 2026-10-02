import { requireRole } from "@/lib/api/auth";
import { TABLE_COLUMNS, cast } from "@/lib/api/db";
import { mapSupabaseError } from "@/lib/api/errors";
import { created, ok, withApi } from "@/lib/api/response";
import { createTableSchema, parseBody } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";
import type { CreateTableInput, RestaurantTable } from "@/types";

export const dynamic = "force-dynamic";

// table_number is text, so a plain SQL ORDER BY would put "10" before "2". Sort naturally.
const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

/** GET /api/tables — PUBLIC (no credentials needed). Sorted by table_number, naturally ("2" before "10"). */
export const GET = withApi(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tables").select(TABLE_COLUMNS);
  if (error) throw mapSupabaseError(error);

  const tables = cast<RestaurantTable[]>(data ?? []).sort((a, b) => collator.compare(a.table_number, b.table_number));
  return ok(tables);
});

/** POST /api/tables — ADMIN. Body: CreateTableInput. */
export const POST = withApi(async (req: Request) => {
  const { supabase } = await requireRole(["admin"]);
  const input: CreateTableInput = await parseBody(req, createTableSchema);

  const { data, error } = await supabase.from("tables").insert(input).select(TABLE_COLUMNS).single();
  if (error) throw mapSupabaseError(error);
  return created(cast<RestaurantTable>(data), "Table created.");
});
