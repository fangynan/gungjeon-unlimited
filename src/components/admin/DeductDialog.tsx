"use client";

import { useState, type FormEvent } from "react";
import type { FefoBatch } from "@/types";

interface Props {
  batch: FefoBatch;
  onClose: () => void;
  /** Return an error message to show in the dialog, or null when it worked. */
  onSubmit: (quantity: number) => Promise<string | null>;
}

export default function DeductDialog({ batch, onClose, onSubmit }: Props) {
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const unit = batch.ingredient.unit;
  const qty = Number(quantity);
  const willDeplete = quantity !== "" && qty === batch.quantity;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (Number.isNaN(qty) || qty <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }
    if (qty > batch.quantity) {
      setError(`Only ${batch.quantity} ${unit} left in this batch.`);
      return;
    }

    setSaving(true);
    const message = await onSubmit(qty);
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
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Deduct Quantity</h2>
          <p className="text-sm text-neutral-600">
            {batch.ingredient.name} · Batch {batch.batch_number} · {batch.quantity} {unit} left
          </p>
        </div>

        {!batch.use_first && (
          <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
            Heads up: another batch of {batch.ingredient.name} expires sooner. FEFO says use that
            one first.
          </p>
        )}

        <div className="space-y-1">
          <label htmlFor="deduct_quantity" className="text-sm font-medium text-neutral-700">
            Quantity used ({unit})
          </label>
          <input
            id="deduct_quantity"
            type="number"
            step="any"
            min={0}
            required
            autoFocus
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
          {willDeplete && (
            <p className="text-xs text-neutral-600">
              This uses up the whole batch, so it will be marked Depleted.
            </p>
          )}
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
            {saving ? "Saving..." : "Deduct"}
          </button>
        </div>
      </form>
    </div>
  );
}