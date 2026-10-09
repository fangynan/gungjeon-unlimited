"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { RestaurantTable } from "@/types";

type Filter = "all" | "available" | "occupied";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All tables" },
  { key: "available", label: "Available" },
  { key: "occupied", label: "Occupied" },
];

export default function TableAvailabilityPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    const res = await apiFetch<RestaurantTable[]>("/api/tables");
    if (res.success && res.data) {
      setTables(res.data);
      setError(null);
    } else {
      setError(res.error ?? "Could not load the tables.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live updates: the public tables list is readable by anyone, so no sign-in is needed.
  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel("public-tables-live")
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
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  // Safety net: when the page comes back into view (for example a phone screen wakes up), refresh.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const availableCount = tables.filter((t) => t.status === "available").length;

  const shown = useMemo(
    () => (filter === "all" ? tables : tables.filter((t) => t.status === filter)),
    [tables, filter]
  );

  return (
    <main>
      <section className="bg-neutral-900 px-4 py-12 text-center text-white">
        <div className="mx-auto max-w-3xl space-y-4">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">Table Availability</h1>
          <p className="text-sm text-neutral-200 sm:text-base">
            A live look at seating before you head over, for your convenience.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-neutral-100">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-green-500" /> Available
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500" /> Occupied
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {loading ? (
          <p className="text-neutral-600">Loading tables...</p>
        ) : error ? (
          <p className="text-red-700">{error}</p>
        ) : tables.length === 0 ? (
          <p className="text-neutral-600">No tables to show yet.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${
                      filter === f.key
                        ? "border-red-700 bg-red-700 text-white"
                        : "border-neutral-400 bg-white text-neutral-800 hover:bg-neutral-100"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 text-sm text-neutral-700">
                <span>
                  {availableCount} of {tables.length} tables available
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${live ? "bg-green-600" : "bg-neutral-400"}`}
                  />
                  {live ? "Live" : "Connecting..."}
                </span>
              </div>
            </div>

            {shown.length === 0 ? (
              <p className="text-neutral-600">No tables match this filter right now.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                {shown.map((t) => {
                  const available = t.status === "available";
                  return (
                    <div
                      key={t.id}
                      className={`rounded-2xl border-2 p-4 text-center ${
                        available ? "border-green-600 bg-green-50" : "border-red-600 bg-red-50"
                      }`}
                    >
                      <p className="text-xs text-neutral-600">Table</p>
                      <p className="text-3xl font-bold text-neutral-900">{t.table_number}</p>
                      <p className="text-sm text-neutral-700">{t.capacity} seats</p>
                      {t.location && <p className="text-xs text-neutral-600">{t.location}</p>}
                      <p
                        className={`mt-2 text-sm font-semibold ${
                          available ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {available ? "AVAILABLE" : "OCCUPIED"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}