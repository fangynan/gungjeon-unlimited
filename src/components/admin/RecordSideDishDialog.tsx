"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api/client";
import type { MenuItem, RestaurantTable } from "@/types";

export interface RecordSideDishValues {
  menu_item_id: string;
  table_id: string | null;
}

interface Props {
  onClose: () => void;
  /** Return an error message to show in the dialog, or null when it worked. */
  onSubmit: (values: RecordSideDishValues) => Promise<string | null>;
}

export default function RecordSideDishDialog({ onClose, onSubmit }: Props) {
  const [dishes, setDishes] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tableId, setTableId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiFetch<MenuItem[]>("/api/menu?category=Side%20Dishes"),
      apiFetch<RestaurantTable[]>("/api/tables"),
    ]).then(([menuRes, tablesRes]) => {
      if (cancelled) return;
      if (menuRes.success && menuRes.data) {
        setDishes(menuRes.data.filter((dish) => dish.is_available));
      } else {
        setError(menuRes.error ?? "Could not load the side dishes.");
      }
      if (tablesRes.success && tablesRes.data) {
        setTables(
          [...tablesRes.data].sort((a, b) =>
            a.table_number.localeCompare(b.table_number, undefined, { numeric: true })
          )
        );
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedId) {
      setError("Please pick a side dish.");
      return;
    }

    setSaving(true);
    const message = await onSubmit({
      menu_item_id: selectedId,
      table_id: tableId === "" ? null : tableId,
    });
    setSaving(false);

    if (message) setError(message);
    else onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
      >
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Record Side Dish</h2>
          <p className="text-sm text-neutral-600">Tap the side dish the customer asked for.</p>
        </div>

        {loading ? (
          <p className="text-neutral-600">Loading side dishes...</p>
        ) : dishes.length === 0 ? (
          <p className="rounded-lg border border-neutral-300 p-4 text-sm text-neutral-700">
            No side dishes are available. Add items in the &quot;Side Dishes&quot; category under
            Menu Management.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {dishes.map((dish) => (
              <button
                key={dish.id}
                type="button"
                aria-pressed={selectedId === dish.id}
                onClick={() => setSelectedId(dish.id)}
                className={`min-h-[56px] rounded-lg border px-3 py-3 text-base font-semibold ${
                  selectedId === dish.id
                    ? "border-red-700 bg-red-700 text-white"
                    : "border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                {dish.name}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="record_table" className="text-sm font-medium text-neutral-700">
            Table (optional)
          </label>
          <select
            id="record_table"
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          >
            <option value="">No table</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                Table {table.table_number} ({table.capacity} seats)
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || loading || dishes.length === 0}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Record"}
          </button>
        </div>
      </form>
    </div>
  );
}