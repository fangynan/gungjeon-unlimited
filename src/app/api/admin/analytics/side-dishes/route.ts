import { requireRole } from "@/lib/api/auth";
import { cast } from "@/lib/api/db";
import { mapSupabaseError } from "@/lib/api/errors";
import { ok, withApi } from "@/lib/api/response";
import { parseQuery, sideDishAnalyticsQuerySchema } from "@/lib/api/validation";
import type { SideDishAnalyticsItem } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/analytics/side-dishes[?period=today|week|month|all] — ADMIN. Defaults to `all`.
 * Every 'Side Dishes' menu item (including ones with no requests), most requested first, then by
 * `views_count`. Periods use restaurant-local time: today = since midnight, week = last 7 days,
 * month = last 30 days (both including today). `views_count` is lifetime, not period-scoped.
 */
export const GET = withApi(async (req: Request) => {
  const { supabase } = await requireRole(["admin"]);
  const { period } = parseQuery(new URL(req.url).searchParams, sideDishAnalyticsQuerySchema);

  const { data, error } = await supabase.rpc("side_dish_analytics", { p_period: period });
  if (error) throw mapSupabaseError(error);
  return ok(cast<SideDishAnalyticsItem[]>(data ?? []));
});
