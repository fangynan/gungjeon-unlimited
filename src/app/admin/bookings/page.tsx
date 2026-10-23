"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { BOOKING_RULES } from "@/lib/validations/booking";
import { formatBookingDate, formatBookingTime, isPastGrace } from "@/lib/booking-format";
import BookingActionDialog from "@/components/admin/BookingActionDialog";
import type { AdminDecision, BookingStatus, PencilBooking } from "@/types";

type Tab = "upcoming" | "history";

// How many history rows to show before the "Show more" button.
const SHOW_FIRST = 20;

/** Re-check "expired" this often so a page left open moves bookings to History on its own. */
const TICK_MS = 30_000;

type Label = { text: string; style: string };

const STATUS_LABELS: Record<BookingStatus, Label> = {
  UPCOMING: { text: "Upcoming", style: "bg-amber-100 text-amber-900" },
  ARRIVED: { text: "Arrived", style: "bg-green-100 text-green-800" },
  CANCELLED: { text: "Cancelled", style: "bg-neutral-200 text-neutral-700" },
};
const EXPIRED_LABEL: Label = { text: "Expired / No-show", style: "bg-red-100 text-red-800" };

export default function BookingsPage() {
  const [bookings, setBookings] = useState<PencilBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [showAll, setShowAll] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [acting, setActing] = useState<{ booking: PencilBooking; action: AdminDecision } | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch<PencilBooking[]>("/api/bookings");
    if (res.success && res.data) {
      setBookings(res.data);
      setError(null);
    } else {
      setError(res.error ?? "Could not load the bookings.");
    }
    setNow(Date.now());
    setLoading(false);
  }, []);

  // Refresh on load (no realtime): the Refresh button does the same thing.
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const isExpired = useCallback(
    (b: PencilBooking) =>
      b.status === "UPCOMING" && isPastGrace(b.booking_date, b.booking_time, BOOKING_RULES.graceMinutes, now),
    [now]
  );

  // Upcoming: still UPCOMING and inside its grace period, soonest first.
  // History: everything else, newest first. The API already returns newest first.
  const { upcoming, history } = useMemo(() => {
    const up: PencilBooking[] = [];
    const past: PencilBooking[] = [];
    for (const b of bookings) {
      if (b.status === "UPCOMING" && !isExpired(b)) up.push(b);
      else past.push(b);
    }
    up.sort((a, b) =>
      `${a.booking_date}T${a.booking_time}`.localeCompare(`${b.booking_date}T${b.booking_time}`)
    );
    return { upcoming: up, history: past };
  }, [bookings, isExpired]);

  const list = tab === "upcoming" ? upcoming : history;
  const visible = tab === "history" && !showAll ? list.slice(0, SHOW_FIRST) : list;

  return (
    <main className="space-y-4 p-4 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Bookings</h1>
          <p className="text-neutral-700">
            Pencil bookings from the website. A booking moves to History {BOOKING_RULES.graceMinutes} minutes after
            its time.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="min-h-[44px] rounded-md border border-neutral-300 bg-white px-4 py-2 font-semibold text-neutral-900 hover:bg-neutral-100 disabled:opacity-60"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { value: "upcoming", label: `Upcoming (${upcoming.length})` },
            { value: "history", label: `History (${history.length})` },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={tab === option.value}
            onClick={() => setTab(option.value)}
            className={`min-h-[44px] rounded-md border px-4 py-2 text-sm font-semibold ${
              tab === option.value
                ? "border-red-700 bg-red-700 text-white"
                : "border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-neutral-600">Loading bookings...</p>
      ) : list.length === 0 ? (
        <p className="rounded-lg border border-neutral-300 p-4 text-neutral-700">
          {tab === "upcoming" ? "No upcoming pencil bookings." : "No past pencil bookings yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((b) => {
            const label = isExpired(b) ? EXPIRED_LABEL : STATUS_LABELS[b.status];
            const canAct = b.status === "UPCOMING" && !isExpired(b);
            return (
              <li key={b.id} className="space-y-3 rounded-lg border border-neutral-300 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words text-lg font-bold text-neutral-900">{b.guest_name}</p>
                    <p className="text-neutral-800">
                      {formatBookingDate(b.booking_date)} at{" "}
                      <span className="font-semibold">{formatBookingTime(b.booking_time)}</span>
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${label.style}`}>{label.text}</span>
                </div>

                <dl className="grid gap-x-6 gap-y-1 text-sm text-neutral-800 sm:grid-cols-3">
                  <div>
                    <dt className="font-medium text-neutral-600">Party size</dt>
                    <dd>{b.party_size}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-neutral-600">Phone</dt>
                    <dd>
                      <a href={`tel:${b.guest_phone}`} className="text-red-700 underline">
                        {b.guest_phone}
                      </a>
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="font-medium text-neutral-600">Email</dt>
                    <dd className="break-all">{b.guest_email}</dd>
                  </div>
                </dl>

                {b.special_requests && (
                  <p className="whitespace-pre-line break-words rounded-md bg-neutral-100 p-3 text-sm text-neutral-800">
                    <span className="font-medium text-neutral-600">Notes: </span>
                    {b.special_requests}
                  </p>
                )}
                {b.staff_notes && (
                  <p className="whitespace-pre-line break-words rounded-md bg-amber-50 p-3 text-sm text-neutral-800">
                    <span className="font-medium text-neutral-600">Staff note: </span>
                    {b.staff_notes}
                  </p>
                )}

                {canAct && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setActing({ booking: b, action: "ARRIVED" })}
                      className="min-h-[44px] rounded-md bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800"
                    >
                      Mark Arrived
                    </button>
                    <button
                      type="button"
                      onClick={() => setActing({ booking: b, action: "CANCELLED" })}
                      className="min-h-[44px] rounded-md border border-red-700 bg-white px-4 py-2 font-semibold text-red-700 hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {tab === "history" && !showAll && history.length > SHOW_FIRST && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="min-h-[44px] rounded-md border border-neutral-300 bg-white px-4 py-2 font-semibold text-neutral-900 hover:bg-neutral-100"
        >
          Show more
        </button>
      )}

      {acting && (
        <BookingActionDialog
          booking={acting.booking}
          action={acting.action}
          onClose={() => setActing(null)}
          onChanged={load}
        />
      )}
    </main>
  );
}
