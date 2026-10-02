import type { AuthContext } from "./auth";
import { restaurantToday } from "./dates";
import { mapSupabaseError } from "./errors";

/**
 * Flip `active` batches whose expiration date has passed to `expired`, so stored statuses match
 * reality. Idempotent; call before reads that filter on status.
 */
export async function markExpiredBatches(supabase: AuthContext["supabase"]): Promise<void> {
  const { error } = await supabase
    .from("inventory_batches")
    .update({ status: "expired" })
    .eq("status", "active")
    .lt("expiration_date", restaurantToday());
  if (error) throw mapSupabaseError(error);
}
