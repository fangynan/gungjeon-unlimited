import type { FefoBatch } from "@/types";

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

// "2026-10-13" -> "Oct 13, 2026" (no timezone shifting)
export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}