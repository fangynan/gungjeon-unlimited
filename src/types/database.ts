/**
 * Entity types — these mirror the rows returned by the API (and the Supabase tables).
 * Safe to import from both server and client code.
 */

// Runtime constants are exported alongside the types so the frontend can build
// <select> options from the same source of truth the API validates against.
export const USER_ROLES = ["admin", "staff", "customer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Roles an admin can assign through /api/admin/staff. */
export const STAFF_ROLES = ["staff", "admin"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const TABLE_STATUSES = ["available", "occupied"] as const;
export type TableStatus = (typeof TABLE_STATUSES)[number];

/** public.profiles */
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  /** `false` = deactivated by an admin: cannot sign in and every API call returns 403. */
  is_active: boolean;
  updated_at: string; // ISO 8601
}

/** public.menu_items */
export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  /** Free text, e.g. "Pork", "Beef", "Side Dishes", "Beverages", "Set Meals". */
  category: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

/** public.tables (named RestaurantTable to avoid clashing with the DOM's HTMLTable* types) */
export interface RestaurantTable {
  id: string;
  /** Text, not a number: "7", "PR-A". Unique. */
  table_number: string;
  capacity: number;
  /** Floor area, e.g. "Indoor", "Outdoor", "Private room". */
  location: string | null;
  status: TableStatus;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export const BATCH_STATUSES = ["active", "expired", "depleted"] as const;
export type BatchStatus = (typeof BATCH_STATUSES)[number];

export const SIDE_DISH_PERIODS = ["today", "week", "month", "all"] as const;
export type SideDishPeriod = (typeof SIDE_DISH_PERIODS)[number];

/** public.ingredients */
export interface Ingredient {
  id: string;
  /** Unique. */
  name: string;
  /** e.g. "kg", "grams", "liters", "packs". */
  unit: string;
  /** Stock below this is flagged as low. 0 disables the flag. */
  minimum_threshold: number;
  created_at: string; // ISO 8601
}

/** GET /api/inventory/ingredients row: an Ingredient plus its usable stock. */
export interface IngredientWithStock extends Ingredient {
  /** Sum of `quantity` over active, unexpired batches. */
  total_stock: number;
  /** `total_stock < minimum_threshold`. */
  is_low_stock: boolean;
}

/** public.inventory_batches */
export interface InventoryBatch {
  id: string;
  ingredient_id: string;
  batch_number: string;
  quantity: number;
  /** Calendar date, `YYYY-MM-DD`. The batch is usable through this day and expired after it. */
  expiration_date: string;
  /** Calendar date the batch was received, `YYYY-MM-DD` (restaurant time). */
  received_date: string;
  status: BatchStatus;
  created_at: string; // ISO 8601
}

/** GET /api/inventory/fefo row: a batch joined with its ingredient, in FEFO order. */
export interface FefoBatch extends InventoryBatch {
  ingredient: Pick<Ingredient, "id" | "name" | "unit">;
  /** Whole days from today (restaurant time) to `expiration_date`; negative once expired. */
  days_until_expiry: number;
  /** True on the one active batch per ingredient that should be used next. */
  use_first: boolean;
}

/** public.inventory_logs: one row per stock change (added / used / adjusted). */
export interface InventoryLog {
  id: string;
  batch_id: string | null;
  /** Copied at the time of the change, so the history still reads well if things are renamed later. */
  ingredient_name: string;
  batch_number: string;
  unit: string;
  change_type: "added" | "used" | "adjusted" | "discarded";
  /** Positive = stock went up, negative = stock went down. */
  quantity_changed: number;
  user_id: string | null;
  user_name: string | null;
  created_at: string; // ISO 8601
}

/** public.side_dish_requests */
export interface SideDishRequest {
  id: string;
  menu_item_id: string;
  table_id: string | null;
  requested_at: string; // ISO 8601
}

/** GET /api/admin/analytics/side-dishes row. */
export interface SideDishAnalyticsItem {
  menu_item_id: string;
  name: string;
  /** Requests within the selected period. */
  request_count: number;
  /** Lifetime counter on menu_items; not narrowed by the period. */
  views_count: number;
  last_requested_at: string | null; // ISO 8601, within the period
}


/** GET /api/side-dishes/recent row: a recorded request with the dish name and table number. */
export interface SideDishRequestDetail {
  id: string;
  menu_item_id: string;
  name: string;
  table_id: string | null;
  table_number: string | null;
  requested_at: string; // ISO 8601
}