import { requireRole } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { created, withApi } from "@/lib/api/response";
import { parseImageUpload } from "@/lib/api/validation";
import type { UploadResult } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET = "menu-images";

/**
 * POST /api/upload — ADMIN. multipart/form-data with the image in the `file` field
 * (JPEG, PNG or WebP, up to 4 MB). Stores it in the public `menu-images` bucket under a random
 * name and returns its public URL, ready to send as `image_url` to POST/PATCH /api/menu.
 */
export const POST = withApi(async (req: Request) => {
  const { supabase } = await requireRole(["admin"]); // auth first: 401/403 before 400
  const { bytes, contentType, extension } = await parseImageUpload(req);

  const path = `${crypto.randomUUID()}.${extension}`; // unique, so a long cache lifetime is safe
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    console.error("[api] image upload failed:", error);
    throw new ApiError(500, "Image upload failed.");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return created<UploadResult>({ publicUrl: data.publicUrl }, "Image uploaded.");
});
