import { z } from "zod";
import { BATCH_STATUSES, SIDE_DISH_PERIODS, STAFF_ROLES, TABLE_STATUSES } from "@/types";
import { ApiError } from "./errors";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validate a `[id]` path segment. Malformed ids are a 400, not a 404. */
export function parseId(raw: string): string {
  if (!UUID_RE.test(raw)) throw new ApiError(400, "Invalid id: expected a UUID.");
  return raw;
}

/** Read + validate a JSON body. Any failure is a 400 with a readable message. */
export async function parseBody<S extends z.ZodTypeAny>(req: Request, schema: S): Promise<z.infer<S>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => (i.path.length ? `${i.path.map(String).join(".")}: ` : "") + i.message)
      .join("; ");
    throw new ApiError(400, `Validation failed: ${details}`);
  }
  return result.data;
}

/** Validate URL query params. Empty values (`?period=`) count as absent. */
export function parseQuery<S extends z.ZodTypeAny>(params: URLSearchParams, schema: S): z.infer<S> {
  const raw: Record<string, string> = {};
  for (const [key, value] of params) if (value.trim() !== "") raw[key] = value.trim();
  const result = schema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => (i.path.length ? `${i.path.map(String).join(".")}: ` : "") + i.message)
      .join("; ");
    throw new ApiError(400, `Invalid query: ${details}`);
  }
  return result.data;
}

/** Escape LIKE wildcards so a user-supplied filter is matched literally. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

const isHttpUrl = (v: string) => {
  try {
    const { protocol } = new URL(v);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

/** Optional text column. `null` or "" both mean "no value" and are stored as null. */
const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional();

const atLeastOneField = (v: object) => Object.values(v).some((x) => x !== undefined);
const AT_LEAST_ONE = "At least one field must be provided.";

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(120),
  description: nullableText(1000),
  category: z.string().trim().min(1, "category is required").max(60),
  price: z.number().min(0, "price must be >= 0").max(99_999_999.99, "price is too large"),
  image_url: z
    .string()
    .trim()
    .max(2048)
    .refine((v) => v === "" || isHttpUrl(v), "image_url must be an http(s) URL")
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  is_available: z.boolean().optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial().refine(atLeastOneField, AT_LEAST_ONE);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const createTableSchema = z.object({
  table_number: z.string().trim().min(1, "table_number is required").max(20),
  capacity: z.number().int("capacity must be a whole number").min(1, "capacity must be at least 1").max(100),
  location: nullableText(100),
  status: z.enum(TABLE_STATUSES).optional(),
});

export const updateTableSchema = createTableSchema.partial().refine(atLeastOneField, AT_LEAST_ONE);

export const updateTableStatusSchema = z.object({
  status: z.enum(TABLE_STATUSES),
});

// ---------------------------------------------------------------------------
// Inventory (FEFO)
// ---------------------------------------------------------------------------

const uuidField = z.string().regex(UUID_RE, "must be a UUID");

/** `YYYY-MM-DD` that is a real calendar date (rejects 2026-02-30). */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be a date formatted YYYY-MM-DD")
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "must be a valid calendar date");

const MAX_QUANTITY = 999_999_999;

export const createIngredientSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(120),
  unit: z.string().trim().min(1, "unit is required").max(30),
  minimum_threshold: z.number().min(0, "minimum_threshold must be >= 0").max(MAX_QUANTITY).optional(),
});

export const createBatchSchema = z.object({
  ingredient_id: uuidField,
  batch_number: z.string().trim().min(1, "batch_number is required").max(60),
  quantity: z.number().gt(0, "quantity must be greater than 0").max(MAX_QUANTITY),
  expiration_date: isoDate,
});

export const deductBatchSchema = z.object({
  quantity: z.number().gt(0, "quantity must be greater than 0").max(MAX_QUANTITY),
});

export const fefoQuerySchema = z.object({
  ingredient_id: uuidField.optional(),
  /** Defaults to `active`: the batches staff should be drawing from. */
  status: z.enum([...BATCH_STATUSES, "all"]).default("active"),
});

// ---------------------------------------------------------------------------
// Side dishes
// ---------------------------------------------------------------------------

export const requestSideDishSchema = z.object({
  menu_item_id: uuidField,
  table_id: uuidField.nullable().optional(),
});

export const sideDishAnalyticsQuerySchema = z.object({
  period: z.enum(SIDE_DISH_PERIODS).default("all"),
});

// ---------------------------------------------------------------------------
// Image upload (multipart)
// ---------------------------------------------------------------------------

// 4 MB, not more: Vercel rejects request bodies over 4.5 MB before they reach the route.
export const IMAGE_MAX_BYTES = 4 * 1024 * 1024;
const IMAGE_EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
type ImageMime = keyof typeof IMAGE_EXTENSIONS;

const imageFileSchema = z
  .custom<File>((v) => typeof File !== "undefined" && v instanceof File, 'a "file" field containing an image is required')
  .refine((f) => f.size > 0, "file is empty")
  .refine((f) => f.size <= IMAGE_MAX_BYTES, `file must be at most ${IMAGE_MAX_BYTES / 1024 / 1024} MB`)
  .refine((f) => Object.prototype.hasOwnProperty.call(IMAGE_EXTENSIONS, f.type), "file must be a JPEG, PNG or WebP image");

const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to));

/** Identify an image by its magic bytes; the client-declared Content-Type is not trusted. */
function sniffImageType(b: Uint8Array): ImageMime | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && ascii(b, 1, 4) === "PNG") return "image/png";
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") return "image/webp";
  return null;
}

export interface ParsedImageUpload {
  bytes: Buffer;
  contentType: ImageMime;
  extension: string;
}

/** Read + validate a multipart upload with a single image in the `file` field. Failures are 400s. */
export async function parseImageUpload(req: Request): Promise<ParsedImageUpload> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, 'Request must be multipart/form-data with an image in the "file" field.');
  }

  const result = imageFileSchema.safeParse(form.get("file"));
  if (!result.success) {
    throw new ApiError(400, `Validation failed: file: ${result.error.issues[0]?.message ?? "invalid"}`);
  }

  const file = result.data;
  const bytes = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImageType(bytes);
  if (!sniffed || sniffed !== file.type) {
    throw new ApiError(400, "Validation failed: file: contents do not match a JPEG, PNG or WebP image.");
  }
  return { bytes, contentType: sniffed, extension: IMAGE_EXTENSIONS[sniffed] };
}

// ---------------------------------------------------------------------------
// Staff accounts
// ---------------------------------------------------------------------------

export const createStaffSchema = z.object({
  email: z.string().trim().toLowerCase().email("email must be a valid email address").max(254),
  // 72 = bcrypt's input limit; anything longer would be silently truncated.
  password: z.string().min(8, "password must be at least 8 characters").max(72, "password must be at most 72 characters"),
  full_name: z.string().trim().min(1, "full_name is required").max(120),
  role: z.enum(STAFF_ROLES).default("staff"),
});

export const updateStaffSchema = z
  .object({
    full_name: z.string().trim().min(1, "full_name cannot be empty").max(120),
    role: z.enum(STAFF_ROLES),
    is_active: z.boolean(),
  })
  .partial()
  .refine(atLeastOneField, AT_LEAST_ONE);
