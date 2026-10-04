"use client";

import { useState, type FormEvent } from "react";

export interface TableFormValues {
  table_number: string;
  capacity: number;
  location: string | null;
}

interface Props {
  title: string;
  submitLabel: string;
  initial?: TableFormValues;
  onClose: () => void;
  /** Return an error message to show in the dialog, or null when it worked. */
  onSubmit: (values: TableFormValues) => Promise<string | null>;
}

export default function TableFormDialog({
  title,
  submitLabel,
  initial,
  onClose,
  onSubmit,
}: Props) {
  const [tableNumber, setTableNumber] = useState(initial?.table_number ?? "");
  const [capacity, setCapacity] = useState(String(initial?.capacity ?? 4));
  const [location, setLocation] = useState(initial?.location ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const seats = Number(capacity);
    if (!Number.isInteger(seats) || seats < 1) {
      setError("Seats must be a whole number of at least 1.");
      return;
    }

    setSaving(true);
    const message = await onSubmit({
      table_number: tableNumber.trim(),
      capacity: seats,
      location: location.trim() === "" ? null : location.trim(),
    });
    setSaving(false);

    if (message) setError(message);
    else onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-lg"
      >
        <h2 className="text-xl font-bold text-neutral-900">{title}</h2>

        <div className="space-y-1">
          <label htmlFor="table_number" className="text-sm font-medium text-neutral-700">
            Table name / number
          </label>
          <input
            id="table_number"
            required
            placeholder="e.g. T15"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="capacity" className="text-sm font-medium text-neutral-700">
            Seats
          </label>
          <input
            id="capacity"
            type="number"
            min={1}
            required
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="location" className="text-sm font-medium text-neutral-700">
            Location (optional)
          </label>
          <input
            id="location"
            placeholder="e.g. Indoor, Outdoor"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}