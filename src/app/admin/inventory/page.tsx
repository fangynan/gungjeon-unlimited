"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { FefoBatch, IngredientWithStock } from "@/types";

// A batch with this many days (or fewer) left is "Near Expiry".
const NEAR_EXPIRY_DAYS = 3;

type DisplayStatus = "In Stock" | "Low Stock" | "Near Expiry" | "Expired" | "Depleted";

const STATUS_OPTIONS: DisplayStatus[] = ["In Stock", "Low Stock", "Near Expiry", "Expired", "Depleted"];

const BADGE: Record<DisplayStatus, string> = {
  "In Stock": "bg-green-100 text-green-800",
  "Low Stock": "bg-yellow-100 text-yellow-800",
  "Near Expiry": "bg-orange-100 text-orange-800",
  Expired: "bg-red-100 text-red-800",
  Depleted: "bg-neutral-200 text-neutral-700",
};

function getStatus(batch: FefoBatch, lowStockIds: Set<string>): DisplayStatus {
  if (batch.status === "depleted") return "Depleted";
  if (batch.status === "expired" || batch.days_until_expiry < 0) return "Expired";
  if (batch.days_until_expiry <= NEAR_EXPIRY_DAYS) return "Near Expiry";
  if (lowStockIds.has(batch.ingredient_id)) return "Low Stock";
  return "In Stock";
}

// "2026-10-13" -> "Oct 13, 2026" (no timezone shifting)
function formatExpiration(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ISO timestamp -> "Oct 5, 2026" in restaurant time
function formatReceived(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function InventoryPage() {
  const [batches, setBatches] = useState<FefoBatch[]>([]);
  const [ingredients, setIngredients] = useState<IngredientWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DisplayStatus>("all");

  const load = useCallback(async () => {
    const [fefoRes, ingredientsRes] = await Promise.all([
      apiFetch<FefoBatch[]>("/api/inventory/fefo?status=all"),
      apiFetch<IngredientWithStock[]>("/api/inventory/ingredients"),
    ]);

    if (fefoRes.success && fefoRes.data && ingredientsRes.success && ingredientsRes.data) {
      setBatches(fefoRes.data);
      setIngredients(ingredientsRes.data);
      setError(null);
    } else {
      setError(fefoRes.error ?? ingredientsRes.error ?? "Could not load inventory.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const lowStockIds = useMemo(
    () => new Set(ingredients.filter((i) => i.is_low_stock).map((i) => i.id)),
    [ingredients]
  );

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return batches
      .map((batch) => ({ batch, status: getStatus(batch, lowStockIds) }))
      .filter(({ batch, status }) => {
        // Depleted batches are hidden unless the filter asks for them.
        if (statusFilter === "all") {
          if (status === "Depleted") return false;
        } else if (status !== statusFilter) {
          return false;
        }
        return batch.ingredient.name.toLowerCase().includes(term);
      });
  }, [batches, lowStockIds, search, statusFilter]);

  return (
    <main className="space-y-4 p-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Inventory</h1>
        <p className="text-neutral-700">
          Ingredient batches, FEFO order, and expiration monitoring in one place.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Ingredient"
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | DisplayStatus)}
          className="rounded-lg border border-neutral-300 px-3 py-2"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="ml-auto text-sm text-neutral-600">Sorted by First-Expired, First-Out</span>
      </div>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{error}</p>
      )}

      {loading ? (
        <p className="text-neutral-600">Loading inventory...</p>
      ) : rows.length === 0 && !error ? (
        <p className="rounded-lg border border-neutral-300 p-4 text-neutral-600">
          {batches.length === 0 ? "No inventory yet." : "No batches match your filters."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-300">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-700">
              <tr>
                <th className="p-3">Ingredient</th>
                <th className="p-3">Batch #</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Date Received</th>
                <th className="p-3">Expiration Date</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ batch, status }) => (
                <tr
                  key={batch.id}
                  className={`border-t border-neutral-200 ${batch.use_first ? "bg-red-50" : ""}`}
                >
                  <td className="p-3 font-medium text-neutral-900">
                    {batch.ingredient.name}
                    {batch.use_first && (
                      <span className="ml-2 rounded bg-red-700 px-2 py-0.5 text-xs font-semibold text-white">
                        Use first
                      </span>
                    )}
                  </td>
                  <td className="p-3">{batch.batch_number}</td>
                  <td className="p-3">
                    {batch.quantity} {batch.ingredient.unit}
                  </td>
                  <td className="p-3">{formatReceived(batch.created_at)}</td>
                  <td className="p-3">{formatExpiration(batch.expiration_date)}</td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${BADGE[status]}`}>
                      {status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}