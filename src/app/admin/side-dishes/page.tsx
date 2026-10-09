"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import RecordSideDishDialog, {
  type RecordSideDishValues,
} from "@/components/admin/RecordSideDishDialog";
import type {
  SideDishAnalyticsItem,
  SideDishPeriod,
  SideDishRequest,
  SideDishRequestDetail,
  UserProfile,
} from "@/types";

// How many rows to show before the "Show more" button.
const SHOW_FIRST = 10;

const PERIOD_OPTIONS: { value: SideDishPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
];

// "2026-10-08T07:05:00Z" -> "Oct 8, 2026, 3:05 PM" (restaurant time)
function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function SideDishesPage() {
  const [requests, setRequests] = useState<SideDishRequestDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showRecord, setShowRecord] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [period, setPeriod] = useState<SideDishPeriod>("week");
  const [analytics, setAnalytics] = useState<SideDishAnalyticsItem[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch<SideDishRequestDetail[]>("/api/side-dishes/recent");
    if (res.success && res.data) {
      setRequests(res.data);
      setError(null);
    } else {
      setError(res.error ?? "Could not load side dish requests.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Only admins see the analytics.
  useEffect(() => {
    apiFetch<UserProfile>("/api/auth/me").then((res) => {
      if (res.success && res.data) setIsAdmin(res.data.role === "admin");
    });
  }, []);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    const res = await apiFetch<SideDishAnalyticsItem[]>(
      `/api/admin/analytics/side-dishes?period=${period}`
    );
    if (res.success && res.data) {
      setAnalytics(res.data);
      setAnalyticsError(null);
    } else {
      setAnalyticsError(res.error ?? "Could not load the analytics.");
    }
    setAnalyticsLoading(false);
  }, [period]);

  useEffect(() => {
    if (isAdmin) loadAnalytics();
  }, [isAdmin, loadAnalytics]);

  const maxAnalyticsCount = Math.max(1, ...analytics.map((item) => Number(item.request_count)));

  async function recordRequest(values: RecordSideDishValues): Promise<string | null> {
    const res = await apiFetch<SideDishRequest>("/api/side-dishes/request", {
      method: "POST",
      json: values,
    });
    if (!res.success) return res.error ?? "Could not record the request.";
    await load();
    if (isAdmin) await loadAnalytics();
    setNotice("Side dish request recorded.");
    setTimeout(() => setNotice(null), 4000);
    return null;
  }

  const visible = showAll ? requests : requests.slice(0, SHOW_FIRST);

  return (
    <main className="space-y-4 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Side Dishes</h1>
          <p className="text-neutral-700">Side dish requests from the dining area.</p>
        </div>
        <button
          onClick={() => setShowRecord(true)}
          className="rounded-md bg-red-700 px-4 py-3 text-base font-semibold text-white hover:bg-red-800"
        >
          + Record Side Dish
        </button>
      </div>

      {notice && (
        <p className="rounded-lg border border-green-300 bg-green-50 p-3 text-green-800">
          {notice}
        </p>
      )}

      {isAdmin && (
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Side Dish Analytics</h2>
            <p className="text-sm text-neutral-700">How often each side dish was requested.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={period === option.value}
                onClick={() => setPeriod(option.value)}
                className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                  period === option.value
                    ? "border-red-700 bg-red-700 text-white"
                    : "border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-600">
            This Week is the last 7 days and This Month is the last 30 days, both including today.
          </p>

          {analyticsError && (
            <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">
              {analyticsError}
            </p>
          )}

          {analyticsLoading && analytics.length === 0 ? (
            <p className="text-neutral-600">Loading analytics...</p>
          ) : (
            !analyticsError &&
            (analytics.length === 0 ? (
              <p className="rounded-lg border border-neutral-300 p-4 text-neutral-600">
                No side dishes in the menu yet.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-neutral-300">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-neutral-100 text-neutral-700">
                    <tr>
                      <th className="p-3">Side Dish</th>
                      <th className="p-3">Requests</th>
                      <th className="p-3">Last Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map((item) => {
                      const count = Number(item.request_count);
                      const widthPct =
                        count === 0 ? 0 : Math.max(4, Math.round((count / maxAnalyticsCount) * 100));
                      return (
                        <tr key={item.menu_item_id} className="border-t border-neutral-200 text-neutral-900">
                          <td className="p-3">
                            <p className="font-medium">{item.name}</p>
                            <div className="mt-1 h-2 w-full max-w-xs rounded-full bg-neutral-200">
                              <div
                                className="h-2 rounded-full bg-red-700"
                                style={{ width: `${widthPct}%` }}
                              />
                            </div>
                          </td>
                          <td className="p-3 font-semibold">{count}</td>
                          <td className="p-3">
                            {item.last_requested_at ? formatWhen(item.last_requested_at) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </section>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Recent Requests</h2>
          <p className="text-sm text-neutral-700">The newest requests first.</p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{error}</p>
        )}

        {loading ? (
          <p className="text-neutral-600">Loading requests...</p>
        ) : !error && requests.length === 0 ? (
          <p className="rounded-lg border border-neutral-300 p-4 text-neutral-600">
            No side dish requests recorded yet.
          </p>
        ) : (
          !error && (
            <div className="overflow-x-auto rounded-lg border border-neutral-300">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-neutral-100 text-neutral-700">
                  <tr>
                    <th className="p-3">When</th>
                    <th className="p-3">Side Dish</th>
                    <th className="p-3">Table</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((request) => (
                    <tr key={request.id} className="border-t border-neutral-200 text-neutral-900">
                      <td className="p-3">{formatWhen(request.requested_at)}</td>
                      <td className="p-3 font-medium">{request.name}</td>
                      <td className="p-3">
                        {request.table_number ? `Table ${request.table_number}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {!error && requests.length > SHOW_FIRST && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="rounded-md border border-neutral-400 px-3 py-1.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100"
          >
            {showAll ? "Show fewer" : `Show more (${requests.length - SHOW_FIRST} more)`}
          </button>
        )}
      </section>

      {showRecord && (
        <RecordSideDishDialog
          onClose={() => setShowRecord(false)}
          onSubmit={recordRequest}
        />
      )}
    </main>
  );
}