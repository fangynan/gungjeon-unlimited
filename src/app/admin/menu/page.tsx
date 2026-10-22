"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import MenuFormDialog, { type MenuFormValues } from "@/components/admin/MenuFormDialog";
import { formatPrice, sortCategories } from "@/lib/menu-categories";
import type { MenuItem, UserProfile } from "@/types";

const ALL = "All";

type View = "active" | "archived";

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState(ALL);
  const [view, setView] = useState<View>("active");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const loadMenu = useCallback(async () => {
    const res = await apiFetch<MenuItem[]>("/api/menu?include_archived=true");
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

  async function setArchived(item: MenuItem, archived: boolean) {
    if (archived) {
      const warning =
        item.category === "Side Dishes"
          ? `Archive "${item.name}"? It will disappear from the public menu and can no longer be recorded as requested, but its request history and analytics are kept. You can restore it anytime under Archived.`
          : `Archive "${item.name}"? It will disappear from the public menu but stay here under Archived. You can restore it anytime.`;
      if (!window.confirm(warning)) return;
    }

    const res = await apiFetch<MenuItem>(`/api/menu/${item.id}`, {
      method: "PATCH",
      json: { is_archived: archived },
    });
    if (!res.success) {
      setError(res.error ?? `Could not ${archived ? "archive" : "restore"} the menu item.`);
      return;
    }
    setError(null);
    await loadMenu();
  }

  const activeCount = useMemo(() => items.filter((i) => !i.is_archived).length, [items]);
  const archivedCount = items.length - activeCount;

  // Items shown in the current view (Active or Archived).
  const viewItems = useMemo(
    () => items.filter((i) => (view === "archived" ? i.is_archived : !i.is_archived)),
    [items, view]
  );

  // Category pills for the current view; the form's category list uses every item.
  const categories = useMemo(() => sortCategories(viewItems.map((i) => i.category)), [viewItems]);
  const allCategories = useMemo(() => sortCategories(items.map((i) => i.category)), [items]);

  // If the chosen category has nothing in this view, fall back to All.
  const tab = categories.includes(activeTab) ? activeTab : ALL;
  const visible = tab === ALL ? viewItems : viewItems.filter((i) => i.category === tab);

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

      <div className="flex gap-2 border-b border-neutral-200 pb-3">
        {(
          [
            ["active", "Active", activeCount],
            ["archived", "Archived", archivedCount],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`rounded-md px-3 py-1 text-sm font-semibold ${
              view === key
                ? "bg-neutral-900 text-white"
                : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {[ALL, ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`rounded-full border px-4 py-1 text-sm ${
              tab === cat
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
        <p className="text-neutral-500">
          {view === "archived" ? "Nothing is archived." : "No menu items here yet."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((item) => (
            <div
              key={item.id}
              className={`space-y-2 rounded-lg border border-neutral-300 p-4 ${
                item.is_archived ? "bg-neutral-50 opacity-75" : ""
              }`}
            >
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
                {item.is_archived ? (
                  <span className="rounded bg-neutral-300 px-2 py-0.5">Archived</span>
                ) : (
                  !item.is_available && (
                    <span className="rounded bg-neutral-200 px-2 py-0.5">Hidden</span>
                  )
                )}
              </div>
              <div className="flex gap-2 pt-1">
                {item.is_archived ? (
                  <button
                    onClick={() => setArchived(item, false)}
                    className="flex-1 rounded-md border border-neutral-400 px-3 py-1 text-sm hover:bg-neutral-100"
                  >
                    Restore
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setEditing(item)}
                      className="flex-1 rounded-md border border-neutral-400 px-3 py-1 text-sm hover:bg-neutral-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setArchived(item, true)}
                      className="flex-1 rounded-md border border-amber-500 px-3 py-1 text-sm text-amber-800 hover:bg-amber-50"
                    >
                      Archive
                    </button>
                  </>
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
          existingCategories={allCategories}
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
          existingCategories={allCategories}
          onClose={() => setEditing(null)}
          onSubmit={editItem}
        />
      )}
    </main>
  );
}