"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { supabaseBrowser } from "@/lib/supabase/browser";
import TableFormDialog, { type TableFormValues } from "@/components/admin/TableFormDialog";
import type { RestaurantTable, TableStatus, UserProfile } from "@/types";

export default function TablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<RestaurantTable | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch<RestaurantTable[]>("/api/tables");
    if (res.success && res.data) {
      setTables(res.data);
      setError(null);
    } else {
      setError(res.error ?? "Could not load tables.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    apiFetch<UserProfile>("/api/auth/me").then((res) => {
      if (res.success && res.data) setIsAdmin(res.data.role === "admin");
    });
  }, []);

  // Live updates: listen for any change to the tables in the database.
  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel("tables-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as RestaurantTable;
            setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          } else {
            // A table was added or removed: reload so the order stays correct.
            load();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  function setStatusLocally(id: string, status: TableStatus) {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  async function toggle(table: RestaurantTable) {
    if (busyIds.includes(table.id)) return;
    const previous = table.status;
    const next: TableStatus = previous === "available" ? "occupied" : "available";

    setBusyIds((ids) => [...ids, table.id]);
    setStatusLocally(table.id, next); // show the change immediately

    const res = await apiFetch<RestaurantTable>(`/api/tables/${table.id}/status`, {
      method: "PATCH",
      json: { status: next },
    });

    if (!res.success) {
      setStatusLocally(table.id, previous); // put it back if the server refused
      setError(res.error ?? "Could not update the table.");
    } else {
      setError(null);
    }
    setBusyIds((ids) => ids.filter((id) => id !== table.id));
  }

    async function addTable(values: TableFormValues): Promise<string | null> {
    const res = await apiFetch<RestaurantTable>("/api/tables", {
      method: "POST",
      json: values,
    });
    if (!res.success) return res.error ?? "Could not add the table.";
    await load();
    return null;
  }

  async function editTable(values: TableFormValues): Promise<string | null> {
    if (!editing) return "No table selected.";
    const res = await apiFetch<RestaurantTable>(`/api/tables/${editing.id}`, {
      method: "PATCH",
      json: values,
    });
    if (!res.success) return res.error ?? "Could not update the table.";
    await load();
    return null;
  }

  async function deleteTable(table: RestaurantTable) {
    const sure = window.confirm(`Delete table ${table.table_number}? This cannot be undone.`);
    if (!sure) return;
    const res = await apiFetch<{ id: string }>(`/api/tables/${table.id}`, {
      method: "DELETE",
    });
    if (!res.success) {
      setError(res.error ?? "Could not delete the table.");
      return;
    }
    setError(null);
    await load();
  }

  return (
    <main className="space-y-4 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Table Management</h1>
          <p className="text-sm text-neutral-500">
            Tap a table to update its status. Capacity shown per table.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-md border border-neutral-400 px-4 py-2 text-sm font-semibold hover:bg-neutral-100"
          >
            + Add Table
          </button>
        )}
      </div>

      <div className="flex gap-4 text-sm text-neutral-700">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-600" /> Available
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-600" /> Occupied
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-neutral-500">Loading tables...</p>
      ) : tables.length === 0 && !error ? (
        <p className="text-neutral-500">No tables yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-neutral-300 p-4 sm:grid-cols-4 lg:grid-cols-6">
                    {tables.map((t) => {
            const available = t.status === "available";
            return (
              <div key={t.id} className="space-y-1">
                <button
                  onClick={() => toggle(t)}
                  disabled={busyIds.includes(t.id)}
                  className={`w-full rounded-2xl border-2 p-4 text-center transition disabled:opacity-60 ${
                    available
                      ? "border-green-600 bg-green-50 hover:bg-green-100"
                      : "border-red-600 bg-red-50 hover:bg-red-100"
                  }`}
                >
                  <p className="text-2xl font-bold text-neutral-900">{t.table_number}</p>
                  <p className="text-xs text-neutral-600">{t.capacity} seats</p>
                  <p
                    className={`text-xs font-semibold ${
                      available ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {available ? "AVAILABLE" : "OCCUPIED"}
                  </p>
                </button>
                {isAdmin && (
                  <div className="flex justify-center gap-3 text-xs">
                    <button
                      onClick={() => setEditing(t)}
                      className="text-neutral-600 underline hover:text-neutral-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTable(t)}
                      className="text-red-600 underline hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

            {showAdd && (
        <TableFormDialog
          title="Add Table"
          submitLabel="Add Table"
          onClose={() => setShowAdd(false)}
          onSubmit={addTable}
        />
      )}

      {editing && (
        <TableFormDialog
          title={`Edit Table ${editing.table_number}`}
          submitLabel="Save changes"
          initial={{
            table_number: editing.table_number,
            capacity: editing.capacity,
            location: editing.location,
          }}
          onClose={() => setEditing(null)}
          onSubmit={editTable}
        />
      )}
    </main>
  );
}