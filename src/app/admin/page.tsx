"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { BADGE, formatDate, getStatus } from "@/lib/inventory-status";
import type {
  FefoBatch,
  IngredientWithStock,
  RestaurantTable,
  SideDishAnalyticsItem,
  UserProfile,
} from "@/types";

// The cards do not need the "Low Stock" status, so we pass an empty list.
const NO_LOW_STOCK = new Set<string>();

// How many rows "Inventory Needing Attention" shows before linking to the full Inventory page.
const MAX_ATTENTION_ROWS = 8;

const ATTENTION_ORDER: Record<string, number> = {
  Expired: 0,
  "Near Expiry": 1,
  "Low Stock": 2,
};

function StatCard({
  label,
  value,
  valueClass = "text-neutral-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-300 p-4">
      <p className="text-sm text-neutral-600">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [batches, setBatches] = useState<FefoBatch[]>([]);
  const [ingredients, setIngredients] = useState<IngredientWithStock[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sideDishes, setSideDishes] = useState<SideDishAnalyticsItem[]>([]);
  const [sideError, setSideError] = useState<string | null>(null);

  // Top 5 side dishes that were actually requested (the backend sends them most requested first).
  const topSideDishes = useMemo(
    () => sideDishes.filter((d) => Number(d.request_count) > 0).slice(0, 5),
    [sideDishes]
  );
  const maxSideCount = Math.max(1, ...topSideDishes.map((d) => Number(d.request_count)));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [fefoRes, ingredientsRes, tablesRes] = await Promise.all([
      apiFetch<FefoBatch[]>("/api/inventory/fefo?status=all"),
      apiFetch<IngredientWithStock[]>("/api/inventory/ingredients"),
      apiFetch<RestaurantTable[]>("/api/tables"),
    ]);

    if (
      fefoRes.success &&
      fefoRes.data &&
      ingredientsRes.success &&
      ingredientsRes.data &&
      tablesRes.success &&
      tablesRes.data
    ) {
      setBatches(fefoRes.data);
      setIngredients(ingredientsRes.data);
      setTables(tablesRes.data);
      setError(null);
    } else {
      setError(
        fefoRes.error ?? ingredientsRes.error ?? tablesRes.error ?? "Could not load the dashboard."
      );
    }
// Side dish analytics are for admins only, so staff never see that card.
    const meRes = await apiFetch<UserProfile>("/api/auth/me");
    if (meRes.success && meRes.data?.role === "admin") {
      setIsAdmin(true);
      const sideRes = await apiFetch<SideDishAnalyticsItem[]>(
        "/api/admin/analytics/side-dishes?period=week"
      );
      if (sideRes.success && sideRes.data) {
        setSideDishes(sideRes.data);
        setSideError(null);
      } else {
        setSideError(sideRes.error ?? "Could not load side dish requests.");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const statuses = batches.map((batch) => getStatus(batch, NO_LOW_STOCK));
    return {
      total: statuses.filter((s) => s !== "Depleted" && s !== "Expired").length,
      nearExpiry: statuses.filter((s) => s === "Near Expiry").length,
      expired: statuses.filter((s) => s === "Expired").length,
    };
  }, [batches]);

  const lowStockIds = useMemo(
    () => new Set(ingredients.filter((i) => i.is_low_stock).map((i) => i.id)),
    [ingredients]
  );

  // Batches that need attention: Expired, Near Expiry, and one batch per Low Stock ingredient.
  const attention = useMemo(() => {
    return batches
      .map((batch) => ({ batch, status: getStatus(batch, lowStockIds) }))
      .filter(
        (row) =>
          row.status === "Expired" ||
          row.status === "Near Expiry" ||
          (row.status === "Low Stock" && row.batch.use_first)
      )
      .sort(
        (a, b) =>
          ATTENTION_ORDER[a.status] - ATTENTION_ORDER[b.status] ||
          a.batch.days_until_expiry - b.batch.days_until_expiry
      );
  }, [batches, lowStockIds]);

  const sortedTables = useMemo(
    () =>
      [...tables].sort((a, b) =>
        a.table_number.localeCompare(b.table_number, undefined, { numeric: true })
      ),
    [tables]
  );
  const availableTables = tables.filter((t) => t.status === "available").length;
  const occupiedTables = tables.length - availableTables;

  return (
    <main className="space-y-4 p-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-700">The restaurant at a glance.</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{error}</p>
      )}

      {loading ? (
        <p className="text-neutral-600">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Items" value={String(counts.total)} />
            <StatCard
              label="Near Expiry"
              value={String(counts.nearExpiry)}
              valueClass="text-orange-700"
            />
            <StatCard
              label="Expired Items"
              value={String(counts.expired)}
              valueClass="text-red-700"
            />
            <StatCard
              label="Table Available"
              value={`${availableTables}/${tables.length}`}
              valueClass="text-green-700"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Table Summary */}
            <section className="rounded-lg border border-neutral-300 p-4">
              <h2 className="text-lg font-semibold text-neutral-900">Table Summary</h2>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-neutral-800">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-green-600" />
                  Available ({availableTables})
                </span>
                <span className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-red-600" />
                  Occupied ({occupiedTables})
                </span>
              </div>
              {sortedTables.length === 0 ? (
                <p className="mt-3 text-sm text-neutral-600">No tables yet.</p>
              ) : (
                <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {sortedTables.map((table) => (
                    <div
                      key={table.id}
                      className={`rounded-md border p-2 text-center ${
                        table.status === "available"
                          ? "border-green-300 bg-green-100 text-green-800"
                          : "border-red-300 bg-red-100 text-red-800"
                      }`}
                    >
                      <p className="text-sm font-bold">{table.table_number}</p>
                      <p className="text-xs">{table.capacity} seats</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {isAdmin && (
              <section className="rounded-lg border border-neutral-300 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Most Requested Side Dishes
                  </h2>
                  <span className="text-sm text-neutral-600">This Week</span>
                </div>
                {sideError ? (
                  <p className="mt-3 text-sm text-red-700">{sideError}</p>
                ) : topSideDishes.length === 0 ? (
                  <p className="mt-3 text-sm text-neutral-600">
                    No side dish requests this week yet.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {topSideDishes.map((dish) => {
                      const count = Number(dish.request_count);
                      const widthPct = Math.max(4, Math.round((count / maxSideCount) * 100));
                      return (
                        <li key={dish.menu_item_id}>
                          <div className="flex items-center justify-between gap-2 text-sm text-neutral-900">
                            <span className="font-medium">{dish.name}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                          <div className="mt-1 h-3 rounded-full bg-neutral-200">
                            <div
                              className="h-3 rounded-full bg-red-700"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </div>

          {/* Inventory Needing Attention */}
          <section className="rounded-lg border border-neutral-300 p-4">
            <h2 className="text-lg font-semibold text-neutral-900">Inventory Needing Attention</h2>
            {attention.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-600">
                Nothing needs attention right now.
              </p>
            ) : (
              <>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="text-neutral-700">
                      <tr className="border-b border-neutral-300">
                        <th className="p-2">Ingredient</th>
                        <th className="p-2">Batch</th>
                        <th className="p-2">Quantity</th>
                        <th className="p-2">Expires</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attention.slice(0, MAX_ATTENTION_ROWS).map(({ batch, status }) => (
                        <tr key={batch.id} className="border-b border-neutral-200 text-neutral-900">
                          <td className="p-2 font-medium">{batch.ingredient.name}</td>
                          <td className="p-2">{batch.batch_number}</td>
                          <td className="p-2">
                            {batch.quantity} {batch.ingredient.unit}
                          </td>
                          <td className="p-2">{formatDate(batch.expiration_date)}</td>
                          <td className="p-2">
                            <span
                              className={`rounded px-2 py-1 text-xs font-semibold ${BADGE[status]}`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-sm text-neutral-700">
                  {attention.length > MAX_ATTENTION_ROWS &&
                    `Showing ${MAX_ATTENTION_ROWS} of ${attention.length}. `}
                  <Link href="/admin/inventory" className="font-semibold text-red-700 underline">
                    Open Inventory
                  </Link>
                </p>
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}