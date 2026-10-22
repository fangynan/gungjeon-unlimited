"use client";

import { useState, type FormEvent } from "react";
import { addDays, restaurantToday } from "@/lib/api/dates";
import { formatDate } from "@/lib/inventory-status";
import type { FefoBatch } from "@/types";

export interface EditBatchValues {
  name: string;
  quantity: number;
  received_date: string; // YYYY-MM-DD
}

interface Props {
  batch: FefoBatch;
  onClose: () => void;
  /** Return an error message to show in the dialog, or null when it worked. */
  onSubmit: (values: EditBatchValues) => Promise<string | null>;
}

export default function EditBatchDialog({ batch, onClose, onSubmit }: Props) {
  const [name, setName] = useState(batch.ingredient.name);
  const [quantity, setQuantity] = useState(String(batch.quantity));
  const [received, setReceived] = useState(batch.received_date);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const unit = batch.ingredient.unit;
  const shelfLife = batch.ingredient.shelf_life_days ?? null; // undefined (field missing) counts as not set

  // The expiration date is not typed in: it is the date received + the ingredient's shelf life.
  // The regex guards against a half-typed date while the field is being edited.
  const expiration =
    shelfLife !== null && /^\d{4}-\d{2}-\d{2}$/.test(received)
      ? addDays(received, shelfLife)
      : batch.expiration_date;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const qty = Number(quantity);
    if (name.trim() === "") {
      setError("Ingredient name is required.");
      return;
    }
    if (quantity.trim() === "" || Number.isNaN(qty) || qty < 0) {
      setError("Quantity must be 0 or more.");
      return;
    }
    if (received > restaurantToday()) {
      setError("Date received cannot be in the future.");
      return;
    }
    if (received > expiration) {
      setError("Date received cannot be after the expiration date.");
      return;
    }

    setSaving(true);
    const message = await onSubmit({
      name: name.trim(),
      quantity: qty,
      received_date: received,
    });
    setSaving(false);

    if (message) setError(message);
    else onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
      >
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Edit Inventory</h2>
          <p className="text-sm text-neutral-600">Batch {batch.batch_number}</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit_name" className="text-sm font-medium text-neutral-700">
            Ingredient name
          </label>
          <input
            id="edit_name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
          <p className="text-xs text-neutral-600">
            Renaming changes this ingredient on all of its batches.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit_quantity" className="text-sm font-medium text-neutral-700">
            Quantity ({unit})
          </label>
          <input
            id="edit_quantity"
            type="number"
            step="any"
            min={0}
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
          <p className="text-xs text-neutral-600">Setting 0 marks the batch as Depleted.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit_received" className="text-sm font-medium text-neutral-700">
            Date received
          </label>
          <input
            id="edit_received"
            type="date"
            required
            max={restaurantToday()}
            value={received}
            onChange={(e) => setReceived(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-neutral-700">Expiration date</p>
          <p className="rounded-md bg-neutral-50 px-3 py-2 text-neutral-900">
            {formatDate(expiration)}
          </p>
          <p className="text-xs text-neutral-600">
            {shelfLife !== null
              ? `Calculated: date received + ${shelfLife}-day shelf life. A past date marks the batch as Expired.`
              : "This ingredient has no shelf life set, so the expiration date stays as it is."}
          </p>
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
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}