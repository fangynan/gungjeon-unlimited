import { requireRole, type AuthContext } from "@/lib/api/auth";
import { PROFILE_COLUMNS, cast } from "@/lib/api/db";
import { ApiError, mapAuthError, mapSupabaseError } from "@/lib/api/errors";
import { ok, withApi } from "@/lib/api/response";
import { parseBody, parseId, updateStaffSchema } from "@/lib/api/validation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { DeletedResource, UpdateStaffInput, UserProfile } from "@/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Supabase has no "ban forever"; ~100 years does the same job. "none" lifts the ban.
const BAN_DURATION = "876000h";

/** These endpoints only manage staff/admin accounts; any other id (customers, unknown) is a 404. */
async function loadStaffTarget(supabase: AuthContext["supabase"], id: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", id)
    .in("role", ["staff", "admin"])
    .maybeSingle();
  if (error) throw mapSupabaseError(error);
  if (!data) throw new ApiError(404, "Staff account not found.");
  return cast<UserProfile>(data);
}

/** Block/unblock sign-in for an auth user. */
async function setBanned(id: string, banned: boolean) {
  return supabaseAdmin().auth.admin.updateUserById(id, { ban_duration: banned ? BAN_DURATION : "none" });
}

/**
 * PUT | PATCH /api/admin/staff/[id] — ADMIN. Body: UpdateStaffInput (partial; both verbs behave identically).
 * Toggling `is_active` also bans/unbans the auth user. An admin cannot deactivate or demote themselves,
 * so the last admin can't lock everyone out.
 */
const update = withApi(async (req: Request, { params }: Ctx) => {
  const { supabase, profile: me } = await requireRole(["admin"]);
  const id = parseId((await params).id);
  const input: UpdateStaffInput = await parseBody(req, updateStaffSchema);

  if (id === me.id) {
    if (input.is_active === false) throw new ApiError(400, "You cannot deactivate your own account.");
    if (input.role !== undefined && input.role !== "admin") throw new ApiError(400, "You cannot remove your own admin role.");
  }

  const target = await loadStaffTarget(supabase, id);
  const statusChanged = input.is_active !== undefined && input.is_active !== target.is_active;

  // Auth first (the part that actually stops sign-ins); undo it if the profile write fails.
  if (statusChanged) {
    const { error } = await setBanned(id, !input.is_active);
    if (error) throw mapAuthError(error);
  }

  const { data, error } = await supabase.from("profiles").update(input).eq("id", id).select(PROFILE_COLUMNS).maybeSingle();
  if (error || !data) {
    if (statusChanged) {
      const { error: revertError } = await setBanned(id, !target.is_active);
      if (revertError) console.error("[api] could not revert ban state for", id, revertError);
    }
    if (error) throw mapSupabaseError(error);
    throw new ApiError(404, "Staff account not found.");
  }
  return ok(cast<UserProfile>(data), "Staff account updated.");
});
export const PUT = update;
export const PATCH = update;

/**
 * DELETE /api/admin/staff/[id] — ADMIN. Permanently deletes the auth user; the profile row goes with it
 * (profiles.id references auth.users on delete cascade). To keep the record but block access, deactivate instead.
 */
export const DELETE = withApi(async (_req: Request, { params }: Ctx) => {
  const { supabase, profile: me } = await requireRole(["admin"]);
  const id = parseId((await params).id);

  if (id === me.id) throw new ApiError(400, "You cannot delete your own account.");
  await loadStaffTarget(supabase, id);

  const { error } = await supabaseAdmin().auth.admin.deleteUser(id);
  if (error) throw mapAuthError(error);
  return ok<DeletedResource>({ id }, "Staff account deleted.");
});
