"use client";

import { useState } from "react";
import type { InventoryLog } from "@/types";

// How many rows to show before the "Show more" button.
const SHOW_FIRST = 10;

const TYPE_LABEL: Record<InventoryLog["change_type"], string> = {
  added: "Stock added",
  used: "Stock used",
  adjusted: "Adjusted",
};

const TYPE_BADGE: Record<InventoryLog["change_type"], string> = {
  added: "bg-green-100 text-green-800",
  used: "bg-neutral-200 text-neutral-800",
  adjusted: "bg-yellow-100 text-yellow-800",
};

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

export default function InventoryActivityLog({
  logs,
  error,
}: {
  logs: InventoryLog[];
  error: string | null;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? logs : logs.slice(0, SHOW_FIRST);

  return (
    <section className="space-y-3 pt-4 text-neutral-900">
      <div>
        <h2 className="text-xl font-bold text-neutral-900">Recent Activity</h2>
        <p className="text-sm text-neutral-700">
          Stock added, used, or corrected. Newest first.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{error}</p>
      )}

      {!error && logs.length === 0 ? (
        <p className="rounded-lg border border-neutral-300 p-4 text-neutral-600">
          No activity recorded yet. New changes will show up here.
        </p>
      ) : (
        !error && (
          <div className="overflow-x-auto rounded-lg border border-neutral-300">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-neutral-100 text-neutral-700">
                <tr>
                  <th className="p-3">When</th>
                  <th className="p-3">Ingredient</th>
                  <th className="p-3">Batch #</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">By</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((log) => (
                  <tr key={log.id} className="border-t border-neutral-200">
                    <td className="p-3">{formatWhen(log.created_at)}</td>
                    <td className="p-3 font-medium text-neutral-900">{log.ingredient_name}</td>
                    <td className="p-3">{log.batch_number}</td>
                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${TYPE_BADGE[log.change_type]}`}
                      >
                        {TYPE_LABEL[log.change_type]}
                      </span>
                    </td>
                    <td className="p-3">
                      {log.quantity_changed > 0 ? "+" : ""}
                      {log.quantity_changed} {log.unit}
                    </td>
                    <td className="p-3">{log.user_name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {!error && logs.length > SHOW_FIRST && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="rounded-md border border-neutral-400 px-3 py-1.5 text-sm font-semibold hover:bg-neutral-100"
        >
          {showAll ? "Show fewer" : `Show more (${logs.length - SHOW_FIRST} more)`}
        </button>
      )}
    </section>
  );
}