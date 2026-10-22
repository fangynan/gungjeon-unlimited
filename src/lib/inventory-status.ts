import type { FefoBatch, IngredientWithStock } from "@/types";

// A batch with this many days (or fewer) left is "Near Expiry".
export const NEAR_EXPIRY_DAYS = 3;

export type DisplayStatus = "In Stock" | "Low Stock" | "Near Expiry" | "Expired" | "Depleted";

export const STATUS_OPTIONS: DisplayStatus[] = [
  "In Stock",
  "Low Stock",
  "Near Expiry",
  "Expired",
  "Depleted",
];

export const BADGE: Record<DisplayStatus, string> = {
  "In Stock": "bg-green-100 text-green-800",
  "Low Stock": "bg-yellow-100 text-yellow-800",
  "Near Expiry": "bg-orange-100 text-orange-800",
  Expired: "bg-red-100 text-red-800",
  Depleted: "bg-neutral-200 text-neutral-700",
};

export function getStatus(batch: FefoBatch, lowStockIds: Set<string>): DisplayStatus {
  if (batch.status === "depleted") return "Depleted";
  if (batch.status === "expired" || batch.days_until_expiry < 0) return "Expired";
  if (batch.days_until_expiry <= NEAR_EXPIRY_DAYS) return "Near Expiry";
  if (lowStockIds.has(batch.ingredient_id)) return "Low Stock";
  return "In Stock";
}

// ---------------------------------------------------------------------------
// Ingredient-level stock state. ONE rule, used by the dashboard, the inventory
// banners and the Stock Levels table, so they always agree.
//
// "Usable stock" (total_stock) = active, unexpired batches added up.
//   Out of Stock : nothing usable left (0).
//   Low Stock    : something left, but below the ingredient's low-stock level.
//   No Level Set : something left, but no low-stock level is set (0 = warning off).
//   In Stock     : at or above the low-stock level.
// Note: the database flag `is_low_stock` is also true at 0 stock, so do not use it for this.
// ---------------------------------------------------------------------------
export type StockLevel = "Out of Stock" | "Low Stock" | "No Level Set" | "In Stock";

export const STOCK_BADGE: Record<StockLevel, string> = {
  "Out of Stock": "bg-red-100 text-red-800",
  "Low Stock": "bg-yellow-100 text-yellow-800",
  "No Level Set": "bg-neutral-100 text-neutral-600",
  "In Stock": "bg-green-100 text-green-800",
};

export function getStockLevel(
  ingredient: Pick<IngredientWithStock, "total_stock" | "minimum_threshold">
): StockLevel {
  const stock = Number(ingredient.total_stock);
  const min = Number(ingredient.minimum_threshold);
  if (stock <= 0) return "Out of Stock";
  if (min <= 0) return "No Level Set";
  if (stock < min) return "Low Stock";
  return "In Stock";
}

// "2026-10-13" -> "Oct 13, 2026" (no timezone shifting)
export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}