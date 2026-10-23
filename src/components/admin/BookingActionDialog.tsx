"use client";

import { useState, type FormEvent } from "react";
import { updateBookingStatusAdmin } from "@/actions/pencil-booking";
import { formatBookingDate, formatBookingTime } from "@/lib/booking-format";
import type { AdminDecision, PencilBooking } from "@/types";

interface Props {
  booking: PencilBooking;
  action: AdminDecision;
  onClose: () => void;
  /** Called after the attempt so the page can reload (also when it failed, e.g. already handled). */
  onChanged: () => void;
}

const COPY: Record<AdminDecision, { title: string; confirm: string; busy: string; style: string }> = {
  ARRIVED: {
    title: "Mark as arrived",
    confirm: "Mark Arrived",
    busy: "Saving...",
    style: "bg-green-700 hover:bg-green-800",
  },
  CANCELLED: {
    title: "Cancel booking",
    confirm: "Cancel Booking",
    busy: "Cancelling...",
    style: "bg-red-700 hover:bg-red-800",
  },
};

export default function BookingActionDialog({ booking, action, onClose, onChanged }: Props) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const copy = COPY[action];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setSaving(true);

    const result = await updateBookingStatusAdmin(booking.id, action, note.trim() === "" ? undefined : note);
    setSaving(false);

    if (result.success) {
      onChanged();
      onClose();
      return;
    }
    setError(result.error);
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
      >
        <div>
          <h2 className="text-xl font-bold text-neutral-900">{copy.title}</h2>
          <p className="text-sm text-neutral-600">
            {booking.guest_name}, {booking.party_size} {booking.party_size === 1 ? "guest" : "guests"},{" "}
            {formatBookingDate(booking.booking_date)} at {formatBookingTime(booking.booking_time)}
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="booking_note" className="text-sm font-medium text-neutral-700">
            Internal note (optional)
          </label>
          <textarea
            id="booking_note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Only staff can see this."
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-md border border-neutral-300 px-4 py-2 font-semibold text-neutral-900 hover:bg-neutral-100"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`min-h-[44px] rounded-md px-4 py-2 font-semibold text-white disabled:opacity-60 ${copy.style}`}
          >
            {saving ? copy.busy : copy.confirm}
          </button>
        </div>
      </form>
    </div>
  );
}
