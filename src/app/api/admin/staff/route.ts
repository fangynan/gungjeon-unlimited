import { requireRole } from "@/lib/api/auth";
import { PROFILE_COLUMNS, cast } from "@/lib/api/db";
import { mapAuthError, mapSupabaseError } from "@/lib/api/errors";
import { created, ok, withApi } from "@/lib/api/response";
import { createStaffSchema, parseBody } from "@/lib/api/validation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CreateStaffInput, UserProfile } from "@/types";

export const dynamic = "force-dynamic";

/** GET /api/admin/staff — ADMIN. Every profile whose role is `staff` or `admin` (including deactivated ones). */
export const GET = withApi(async () => {
  const { supabase } = await requireRole(["admin"]);

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .in("role", ["staff", "admin"])
    .order("role")
    .order("email");
  if (error) throw mapSupabaseError(error);
  return ok(cast<UserProfile[]>(data ?? []));
});

/**
 * POST /api/admin/staff — ADMIN. Body: CreateStaffInput (`role` defaults to "staff").
 * Creates a confirmed auth user (so they can sign in straight away), then sets up their profile.
 * If the profile step fails the auth user is removed again, so no half-created account is left behind.
 */
export const POST = withApi(async (req: Request) => {
  await requireRole(["admin"]); // auth first: 401/403 before 400
  const input: CreateStaffInput = await parseBody(req, createStaffSchema);
  const { email, password, full_name } = input;
  const role = input.role ?? "staff";

  const admin = supabaseAdmin(); // service role: bypasses RLS, server-side only
  const { data: auth, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (authError || !auth.user) throw mapAuthError(authError ?? { message: "createUser returned no user" });
  const userId = auth.user.id;

  // The on_auth_user_created trigger has already inserted a 'customer' profile; upsert covers that
  // row (and the case where the trigger is missing) and promotes it to the requested role.
  const { data, error } = await admin
    .from("profiles")
    .upsert({ id: userId, email, full_name, role, is_active: true }, { onConflict: "id" })
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    const { error: cleanupError } = await admin.auth.admin.deleteUser(userId);
    if (cleanupError) console.error("[api] could not roll back auth user", userId, cleanupError);
    throw mapSupabaseError(error);
  }
  return created(cast<UserProfile>(data), "Staff account created.");
});
