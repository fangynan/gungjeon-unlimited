"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import MenuFormDialog, { type MenuFormValues } from "@/components/admin/MenuFormDialog";
import { formatPrice, sortCategories } from "@/lib/menu-categories";
import type { MenuItem, UserProfile } from "@/types";

const ALL = "All";

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState(ALL);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const loadMenu = useCallback(async () => {
    const res = await apiFetch<MenuItem[]>("/api/menu");
    if (res.success && res.data) {
      setItems(res.data);
      setError(null);
    } else {
      setError(res.error ?? "Could not load the menu.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    apiFetch<UserProfile>("/api/auth/me").then((res) => {
      setIsAdmin(res.success && res.data ? res.data.role === "admin" : false);
    });
    loadMenu();
  }, [loadMenu]);

    async function addItem(values: MenuFormValues): Promise<string | null> {
    const res = await apiFetch<MenuItem>("/api/menu", { method: "POST", json: values });
    if (!res.success) return res.error ?? "Could not add the menu item.";
    await loadMenu();
    return null;
  }

  async function editItem(values: MenuFormValues): Promise<string | null> {
    if (!editing) return "No item selected.";
    const res = await apiFetch<MenuItem>(`/api/menu/${editing.id}`, {
      method: "PATCH",
      json: values,
    });
    if (!res.success) return res.error ?? "Could not update the menu item.";
    await loadMenu();
    return null;
  }

  async function deleteItem(item: MenuItem) {
    const warning =
      item.category === "Side Dishes"
        ? `Delete "${item.name}"? All of its side-dish request history will be deleted too, and the analytics will change. To keep the history, click Cancel and untick "Available" in Edit instead.`
        : `Delete "${item.name}"? This cannot be undone.`;
    if (!window.confirm(warning)) return;

    const res = await apiFetch<{ id: string }>(`/api/menu/${item.id}`, { method: "DELETE" });
    if (!res.success) {
      setError(res.error ?? "Could not delete the menu item.");
      return;
    }
    setError(null);
    await loadMenu();
  }

  const categories = useMemo(
    () => sortCategories(items.map((i) => i.category)),
    [items]
  );

  const visible = activeTab === ALL ? items : items.filter((i) => i.category === activeTab);

  if (isAdmin === false) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-neutral-900">Menu Management</h1>
        <p className="mt-2 text-neutral-600">Only the owner or manager can manage the menu.</p>
      </main>
    );
  }

  return (
    <main className="space-y-4 p-8">
            <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Menu Management</h1>
          <p className="text-sm text-neutral-500">
            Keep sets, side dishes, and flavors accurate for staff and guests.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="shrink-0 rounded-md border border-neutral-400 px-4 py-2 text-sm font-semibold hover:bg-neutral-100"
        >
          + Add Menu Item
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[ALL, ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`rounded-full border px-4 py-1 text-sm ${
              activeTab === cat
                ? "border-red-700 bg-red-700 text-white"
                : "border-neutral-400 text-neutral-800 hover:bg-neutral-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-neutral-500">Loading menu...</p>
      ) : visible.length === 0 && !error ? (
        <p className="text-neutral-500">No menu items here yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((item) => (
            <div key={item.id} className="space-y-2 rounded-lg border border-neutral-300 p-4">
              {item.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-32 w-full rounded-md object-cover"
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-neutral-900">{item.name}</h2>
                <span className="shrink-0 text-sm font-semibold text-neutral-800">
                  {formatPrice(item.price)}
                </span>
              </div>
              {item.description && (
                <p className="text-sm text-neutral-600">{item.description}</p>
              )}
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span>{item.category}</span>
                {!item.is_available && (
                  <span className="rounded bg-neutral-200 px-2 py-0.5">Hidden</span>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditing(item)}
                  className="flex-1 rounded-md border border-neutral-400 px-3 py-1 text-sm hover:bg-neutral-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteItem(item)}
                  className="flex-1 rounded-md border border-red-400 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
            )}

            {showAdd && (
        <MenuFormDialog
          title="Add Menu Item"
          submitLabel="Add Item"
          existingCategories={categories}
          onClose={() => setShowAdd(false)}
          onSubmit={addItem}
        />
      )}

      {editing && (
        <MenuFormDialog
          title={`Edit ${editing.name}`}
          submitLabel="Save changes"
          initial={{
            name: editing.name,
            description: editing.description,
            category: editing.category,
            price: editing.price,
            is_available: editing.is_available,
            image_url: editing.image_url,
          }}
          existingCategories={categories}
          onClose={() => setEditing(null)}
          onSubmit={editItem}
        />
      )}
    </main>
  );
}