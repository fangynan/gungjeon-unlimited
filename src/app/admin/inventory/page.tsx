"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { supabaseBrowser } from "@/lib/supabase/browser";
import AddInventoryDialog, {
  type BatchFormValues,
  type NewIngredientValues,
} from "@/components/admin/AddInventoryDialog";
import DeductDialog from "@/components/admin/DeductDialog";
import EditBatchDialog, { type EditBatchValues } from "@/components/admin/EditBatchDialog";
import InventoryActivityLog from "@/components/admin/InventoryActivityLog";
import type {
  FefoBatch,
  Ingredient,
  IngredientWithStock,
  InventoryBatch,
  InventoryLog,
  UserProfile,
} from "@/types";

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
function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [deducting, setDeducting] = useState<FefoBatch | null>(null);
  const [editing, setEditing] = useState<FefoBatch | null>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [logError, setLogError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [fefoRes, ingredientsRes, logsRes] = await Promise.all([
      apiFetch<FefoBatch[]>("/api/inventory/fefo?status=all"),
      apiFetch<IngredientWithStock[]>("/api/inventory/ingredients"),
      apiFetch<InventoryLog[]>("/api/inventory/logs"),
    ]);

    if (fefoRes.success && fefoRes.data && ingredientsRes.success && ingredientsRes.data) {
      setBatches(fefoRes.data);
      setIngredients(ingredientsRes.data);
      setError(null);
    } else {
      setError(fefoRes.error ?? ingredientsRes.error ?? "Could not load inventory.");
    }
        if (logsRes.success && logsRes.data) {
      setLogs(logsRes.data);
      setLogError(null);
    } else {
      setLogError(logsRes.error ?? "Could not load the activity history.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live updates: when anyone changes the inventory, reload the lists.
  useEffect(() => {
    const supabase = supabaseBrowser();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    // One action can cause several database changes at once, so wait a moment and reload only once.
    function reloadSoon() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        load();
      }, 400);
    }

    async function start() {
      // The inventory tables are private, so the live connection must know who we are
      // before it subscribes. Otherwise the database sends us nothing.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) supabase.realtime.setAuth(data.session.access_token);

      channel = supabase
        .channel("inventory-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "inventory_batches" }, reloadSoon)
        .on("postgres_changes", { event: "*", schema: "public", table: "ingredients" }, reloadSoon)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "inventory_logs" }, reloadSoon)
        .subscribe();
    }
    start();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [load]);

  useEffect(() => {
    apiFetch<UserProfile>("/api/auth/me").then((res) => {
      if (res.success && res.data) setIsAdmin(res.data.role === "admin");
    });
  }, []);

  async function createIngredient(
    values: NewIngredientValues
  ): Promise<{ id: string | null; error: string | null }> {
    const res = await apiFetch<Ingredient>("/api/inventory/ingredients", {
      method: "POST",
      json: values,
    });
    if (!res.success || !res.data) {
      return { id: null, error: res.error ?? "Could not create the ingredient." };
    }
    await load(); // so the new ingredient appears in the dropdown
    return { id: res.data.id, error: null };
  }

  async function addBatch(values: BatchFormValues): Promise<string | null> {
    const res = await apiFetch<InventoryBatch>("/api/inventory/batches", {
      method: "POST",
      json: values,
    });
    if (!res.success) return res.error ?? "Could not add the batch.";
    await load();
    return null;
  }

  async function deductBatch(quantity: number): Promise<string | null> {
    if (!deducting) return "No batch selected.";
    const res = await apiFetch<InventoryBatch>(
      `/api/inventory/batches/${deducting.id}/deduct`,
      { method: "PATCH", json: { quantity } }
    );
    if (!res.success) return res.error ?? "Could not deduct the quantity.";
    await load();
    return null;
  }

  async function editBatch(values: EditBatchValues): Promise<string | null> {
    if (!editing) return "No batch selected.";

    // Only send what actually changed.
    const batchChanges: { quantity?: number; received_date?: string; expiration_date?: string } = {};
    if (values.quantity !== editing.quantity) batchChanges.quantity = values.quantity;
    if (values.received_date !== editing.received_date) batchChanges.received_date = values.received_date;
    if (values.expiration_date !== editing.expiration_date) {
      batchChanges.expiration_date = values.expiration_date;
    }
    const nameChanged = values.name !== editing.ingredient.name;

    if (Object.keys(batchChanges).length > 0) {
      const res = await apiFetch<InventoryBatch>(`/api/inventory/batches/${editing.id}`, {
        method: "PATCH",
        json: batchChanges,
      });
      if (!res.success) return res.error ?? "Could not update the batch.";
    }

    if (nameChanged) {
      const res = await apiFetch<Ingredient>(`/api/inventory/ingredients/${editing.ingredient_id}`, {
        method: "PATCH",
        json: { name: values.name },
      });
      if (!res.success) {
        await load();
        return `The batch was saved, but the name could not be changed: ${res.error ?? "unknown error"}`;
      }
    }

    await load();
    return null;
  }

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Inventory</h1>
          <p className="text-neutral-700">
            Ingredient batches, FEFO order, and expiration monitoring in one place.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-md border border-neutral-400 px-4 py-2 text-sm font-semibold hover:bg-neutral-100"
        >
          + Add Inventory
        </button>
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
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ batch, status }) => {
                const canDeduct = status !== "Expired" && status !== "Depleted";
                return (
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
                    <td className="p-3">{formatDate(batch.received_date)}</td>
                    <td className="p-3">{formatDate(batch.expiration_date)}</td>
                    <td className="p-3">
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${BADGE[status]}`}>
                        {status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {canDeduct && (
                          <button
                            onClick={() => setDeducting(batch)}
                            className="rounded-md border border-neutral-400 px-3 py-1 text-xs font-semibold hover:bg-neutral-100"
                          >
                            Deduct
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setEditing(batch)}
                            className="rounded-md border border-neutral-400 px-3 py-1 text-xs font-semibold hover:bg-neutral-100"
                          >
                            Edit
                          </button>
                        )}
                        {!canDeduct && !isAdmin && <span className="text-neutral-400">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

            {!loading && <InventoryActivityLog logs={logs} error={logError} />}

      {showAdd && (
        <AddInventoryDialog
          ingredients={ingredients}
          canCreateIngredient={isAdmin}
          onClose={() => setShowAdd(false)}
          onCreateIngredient={createIngredient}
          onSubmit={addBatch}
        />
      )}
      {deducting && (
        <DeductDialog
          batch={deducting}
          onClose={() => setDeducting(null)}
          onSubmit={deductBatch}
        />
      )}
      {editing && (
        <EditBatchDialog
          batch={editing}
          onClose={() => setEditing(null)}
          onSubmit={editBatch}
        />
      )}
    </main>
  );
}