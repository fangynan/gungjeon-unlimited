import type { UserProfile, UserRole } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { ApiError, mapSupabaseError } from "./errors";
import { PROFILE_COLUMNS, cast } from "./db";

export interface AuthContext {
  /** Session-scoped client: acts as the signed-in user, so Row Level Security still applies. */
  supabase: Awaited<ReturnType<typeof createClient>>;
  profile: UserProfile;
}

/** 401 if there is no valid session; 403 if the account has no profile row or is deactivated. */
export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser(); // verifies the JWT with Supabase Auth
  if (error || !data?.user) throw new ApiError(401, "Authentication required.");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", data.user.id)
    .maybeSingle();
  if (profileError) throw mapSupabaseError(profileError);
  if (!profile) throw new ApiError(403, "No profile exists for this account.");

  const userProfile = cast<UserProfile>(profile);
  // Banning in Supabase Auth only stops new sign-ins; an already-issued token stays valid until it
  // expires. Checking here makes deactivation take effect on the very next request.
  if (!userProfile.is_active) throw new ApiError(403, "This account has been deactivated.");

  return { supabase, profile: userProfile };
}

/** `requireAuth` + role check. 401 unauthenticated, 403 wrong role. */
export async function requireRole(allowed: readonly UserRole[]): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!allowed.includes(ctx.profile.role)) {
    throw new ApiError(403, `Forbidden: requires role ${allowed.join(" or ")}.`);
  }
  return ctx;
}
