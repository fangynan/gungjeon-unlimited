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
import EditIngredientDialog, {
  type IngredientSettingsValues,
} from "@/components/admin/EditIngredientDialog";
import InventoryActivityLog from "@/components/admin/InventoryActivityLog";
import StockLevels from "@/components/admin/StockLevels";
import type {
  FefoBatch,
  Ingredient,
  IngredientWithStock,
  InventoryBatch,
  InventoryLog,
  UpdateIngredientInput,
  UserProfile,
} from "@/types";
import {
  BADGE,
  STATUS_OPTIONS,
  formatDate,
  getStatus,
  getStockLevel,
  type DisplayStatus,
} from "@/lib/inventory-status";



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
  const [editingIngredient, setEditingIngredient] = useState<IngredientWithStock | null>(null);
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

  async function discardBatch(batch: FefoBatch) {
    const confirmed = window.confirm(
      `Discard ${batch.ingredient.name} (batch ${batch.batch_number}, ${batch.quantity} ${batch.ingredient.unit})?\n\nThe whole batch is cleared from the stock list and recorded in Recent Activity. This cannot be undone.`
    );
    if (!confirmed) return;
    const res = await apiFetch<InventoryBatch>(`/api/inventory/batches/${batch.id}/discard`, {
      method: "POST",
    });
    if (!res.success) {
      setError(res.error ?? "Could not discard the batch.");
      return;
    }
    await load();
  }

  async function editBatch(values: EditBatchValues): Promise<string | null> {
    if (!editing) return "No batch selected.";

    // Only send what actually changed.
    // (The expiration date is not sent: the database recalculates it from the received date.)
    const batchChanges: { quantity?: number; received_date?: string } = {};
    if (values.quantity !== editing.quantity) batchChanges.quantity = values.quantity;
    if (values.received_date !== editing.received_date) batchChanges.received_date = values.received_date;
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

  async function saveIngredient(values: IngredientSettingsValues): Promise<string | null> {
    if (!editingIngredient) return "No ingredient selected.";

    // Only send what actually changed.
    const changes: UpdateIngredientInput = {};
    if (values.shelf_life_days !== editingIngredient.shelf_life_days) {
      changes.shelf_life_days = values.shelf_life_days;
    }
    if (values.minimum_threshold !== Number(editingIngredient.minimum_threshold)) {
      changes.minimum_threshold = values.minimum_threshold;
    }

    if (Object.keys(changes).length > 0) {
      const res = await apiFetch<Ingredient>(`/api/inventory/ingredients/${editingIngredient.id}`, {
        method: "PATCH",
        json: changes,
      });
      if (!res.success) return res.error ?? "Could not update the ingredient.";
    }

    await load();
    return null;
  }

  // Low Stock = some left but below the level. Out of Stock (0 left) is a separate state.
  const lowStockIngredients = useMemo(
    () => ingredients.filter((i) => getStockLevel(i) === "Low Stock"),
    [ingredients]
  );
  const outOfStockIngredients = useMemo(
    () => ingredients.filter((i) => getStockLevel(i) === "Out of Stock"),
    [ingredients]
  );
  const lowStockIds = useMemo(
    () => new Set(lowStockIngredients.map((i) => i.id)),
    [lowStockIngredients]
  );
  // True when no ingredient has a low-stock level yet (0 turns the warning off).
  const noLevelsSet =
    ingredients.length > 0 && !ingredients.some((i) => Number(i.minimum_threshold) > 0);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return batches
      .map((batch) => ({ batch, status: getStatus(batch, lowStockIds) }))
      .filter(({ batch, status }) => {
        if (statusFilter === "all") {
          // Depleted batches are hidden unless the filter asks for them.
          if (status === "Depleted") return false;
        } else if (statusFilter === "Low Stock") {
          // Low stock belongs to the ingredient, not to one batch. List every usable batch of a
          // low-stock ingredient, even one whose own status is Near Expiry.
          if (status === "Expired" || status === "Depleted") return false;
          if (!lowStockIds.has(batch.ingredient_id)) return false;
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

      {!loading && outOfStockIngredients.length > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          <span className="font-semibold">Out of stock:</span>{" "}
          {outOfStockIngredients.map((i) => i.name).join(", ")}.
        </div>
      )}
      {!loading && lowStockIngredients.length > 0 && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
          <span className="font-semibold">Low on stock:</span>{" "}
          {lowStockIngredients
            .map((i) => `${i.name} (${Number(i.total_stock)} ${i.unit} left)`)
            .join(", ")}
          .
        </div>
      )}
      {!loading && noLevelsSet && (
        <p className="rounded-lg border border-neutral-300 bg-neutral-50 p-3 text-sm text-neutral-700">
          No low-stock levels are set yet, so nothing can be flagged as Low Stock.{" "}
          {isAdmin ? "Use Edit under Stock Levels to set one." : "Ask an admin to set them."}
        </p>
      )}

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
                const canDiscard = status === "Expired";
                return (
                  <tr
                    key={batch.id}
                    className={`border-t border-neutral-200 ${batch.use_first ? "bg-red-50" : ""}`}
                  >
                    <td className="p-3 font-medium text-neutral-900">
                      {batch.ingredient.name}
                      {status === "Near Expiry" && lowStockIds.has(batch.ingredient_id) && (
                        <span className="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                          Low stock
                        </span>
                      )}
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
                        {canDiscard && (
                          <button
                            onClick={() => discardBatch(batch)}
                            className="rounded-md border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                          >
                            Discard
                          </button>
                        )}
                        {!canDeduct && !canDiscard && !isAdmin && (
                          <span className="text-neutral-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <StockLevels ingredients={ingredients} isAdmin={isAdmin} onEdit={setEditingIngredient} />
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
      {editingIngredient && (
        <EditIngredientDialog
          ingredient={editingIngredient}
          onClose={() => setEditingIngredient(null)}
          onSubmit={saveIngredient}
        />
      )}
    </main>
  );
}