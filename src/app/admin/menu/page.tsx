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
    </main>
  );
}