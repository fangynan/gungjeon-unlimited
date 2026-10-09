"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { formatPrice, sortCategories } from "@/lib/menu-categories";
import type { MenuItem } from "@/types";

const ALL = "All";

export default function PublicMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(ALL);

  useEffect(() => {
    apiFetch<MenuItem[]>("/api/menu").then((res) => {
      if (res.success && res.data) {
        // Visitors only see items marked Available.
        setItems(res.data.filter((i) => i.is_available));
        setError(null);
      } else {
        setError(res.error ?? "Could not load the menu.");
      }
      setLoading(false);
    });
  }, []);

  const categories = useMemo(() => sortCategories(items.map((i) => i.category)), [items]);

  const sections = useMemo(() => {
    const shown = active === ALL ? categories : categories.filter((c) => c === active);
    return shown.map((category) => {
      const list = items.filter((i) => i.category === category);
      // Packages: most expensive first. Everything else: A to Z (already sorted by the API).
      if (category === "Unli Sets") list.sort((a, b) => b.price - a.price);
      return { category, list };
    });
  }, [items, categories, active]);

  return (
    <main>
      <section className="bg-neutral-900 px-4 py-12 text-center text-white">
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">The Menu</h1>
          <p className="text-sm text-neutral-200 sm:text-base">
            Everything below is served unlimited unless marked as an add-on.
          </p>
          <ul className="mx-auto grid max-w-xl gap-2 text-sm sm:grid-cols-3">
            <li className="rounded-lg border border-neutral-600 px-3 py-2 text-neutral-100">
              No left-over policy
            </li>
            <li className="rounded-lg border border-neutral-600 px-3 py-2 text-neutral-100">
              Left-overs are charged ₱1 per gram
            </li>
            <li className="rounded-lg border border-neutral-600 px-3 py-2 text-neutral-100">
              1 Unli set per table
            </li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {loading ? (
          <p className="text-neutral-600">Loading the menu...</p>
        ) : error ? (
          <p className="text-red-700">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-neutral-600">The menu is being updated. Please check back soon.</p>
        ) : (
          <>
            {/* Filter tabs: scroll sideways on small phones */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[ALL, ...categories].map((c) => (
                <button
                  key={c}
                  onClick={() => setActive(c)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${
                    active === c
                      ? "border-red-700 bg-red-700 text-white"
                      : "border-neutral-400 bg-white text-neutral-800 hover:bg-neutral-100"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {sections.map(({ category, list }) => (
              <div key={category} className="space-y-3">
                <h2 className="border-b border-neutral-300 pb-1 text-2xl font-bold text-neutral-900">
                  {category}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((item) => (
                    <article
                      key={item.id}
                      className="flex flex-col overflow-hidden rounded-lg border border-neutral-300 bg-white"
                    >
                      {item.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-44 w-full object-cover"
                        />
                      )}
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-semibold text-neutral-900">{item.name}</h3>
                          <p
                            className={`shrink-0 text-lg font-bold ${
                              item.price === 0 ? "text-green-700" : "text-red-700"
                            }`}
                          >
                            {formatPrice(item.price)}
                          </p>
                        </div>
                        {item.description && (
                          <p className="text-sm text-neutral-700">{item.description}</p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </section>
    </main>
  );
}