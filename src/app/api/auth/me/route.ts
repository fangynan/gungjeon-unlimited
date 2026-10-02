import { requireAuth } from "@/lib/api/auth";
import { ok, withApi } from "@/lib/api/response";

export const dynamic = "force-dynamic";

/** GET /api/auth/me — the signed-in user's profile (including role). 401 if signed out. */
export const GET = withApi(async () => {
  const { profile } = await requireAuth();
  return ok(profile);
});
