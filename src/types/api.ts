/**
 * API contract types: the response envelope and request payloads.
 * Safe to import from both server and client code (no runtime dependencies).
 */
import type { StaffRole, TableStatus } from "./database";

/** Every endpoint returns this exact shape, on success and on failure. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  /** Payload on success, `null` on failure. */
  data: T | null;
  /** Human-readable error on failure, `null` on success. */
  error: string | null;
  message?: string;
}

/** `data` payload of every DELETE endpoint. */
export interface DeletedResource {
  id: string;
}

// ---- Menu -----------------------------------------------------------------

/** POST /api/menu */
export interface CreateMenuItemInput {
  name: string;
  description?: string | null;
  category: string;
  price: number;
  image_url?: string | null;
  /** Defaults to `true` when omitted. */
  is_available?: boolean;
}

/** PUT | PATCH /api/menu/[id] — partial update; at least one field is required. */
export type UpdateMenuItemInput = Partial<CreateMenuItemInput>;

// ---- Tables ---------------------------------------------------------------

/** POST /api/tables */
export interface CreateTableInput {
  table_number: string;
  capacity: number;
  location?: string | null;
  /** Defaults to `"available"` when omitted. */
  status?: TableStatus;
}

/** PATCH /api/tables/[id] (admin) — partial update; at least one field is required. */
export type UpdateTableInput = Partial<CreateTableInput>;

/** PATCH /api/tables/[id]/status (admin or staff) */
export interface UpdateTableStatusInput {
  status: TableStatus;
}

// ---- Inventory (FEFO) -----------------------------------------------------

/** POST /api/inventory/ingredients (admin) */
export interface CreateIngredientInput {
  name: string;
  unit: string;
  /** Defaults to 0 when omitted. */
  minimum_threshold?: number;
}

/** POST /api/inventory/batches (admin or staff). New batches start `active`. */
export interface CreateBatchInput {
  ingredient_id: string;
  batch_number: string;
  /** Must be > 0. */
  quantity: number;
  /** `YYYY-MM-DD`, today or later. */
  expiration_date: string;
}

/** PATCH /api/inventory/ingredients/[id] (admin). Send only the fields you want to change. */
export interface UpdateIngredientInput {
  name?: string;
  /** Low-stock warning level; 0 turns the warning off. */
  minimum_threshold?: number;
}

/** PATCH /api/inventory/batches/[id] (admin). Send only the fields you want to change. */
export interface UpdateBatchInput {
  /** New total quantity (>= 0). Setting 0 marks the batch depleted. */
  quantity?: number;
  /** `YYYY-MM-DD`, not in the future, not after the expiration date. */
  received_date?: string;
  /** `YYYY-MM-DD`. A past date marks the batch expired. */
  expiration_date?: string;
}

/** PATCH /api/inventory/batches/[id]/deduct (admin or staff) */
export interface DeductBatchInput {
  /** Amount to remove; must be > 0 and no more than the batch holds. */
  quantity: number;
}

// ---- Side dishes ----------------------------------------------------------

/** POST /api/side-dishes/request (public) */
export interface RequestSideDishInput {
  menu_item_id: string;
  table_id?: string | null;
}

// ---- Upload ---------------------------------------------------------------

/** `data` payload of POST /api/upload. */
export interface UploadResult {
  publicUrl: string;
}

// ---- Staff accounts -------------------------------------------------------

/** POST /api/admin/staff (admin) */
export interface CreateStaffInput {
  email: string;
  /** 8-72 characters. */
  password: string;
  full_name: string;
  /** Defaults to `"staff"` when omitted. */
  role?: StaffRole;
}

/** PUT | PATCH /api/admin/staff/[id] (admin) — partial update; at least one field is required. */
export interface UpdateStaffInput {
  full_name?: string;
  role?: StaffRole;
  is_active?: boolean;
}
