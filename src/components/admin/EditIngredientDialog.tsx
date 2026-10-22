"use client";

import { useState, type FormEvent } from "react";
import type { IngredientWithStock } from "@/types";

export interface IngredientSettingsValues {
  shelf_life_days: number;
  minimum_threshold: number;
}

interface Props {
  ingredient: IngredientWithStock;
  onClose: () => void;
  /** Return an error message to show in the dialog, or null when it worked. */
  onSubmit: (values: IngredientSettingsValues) => Promise<string | null>;
}

export default function EditIngredientDialog({ ingredient, onClose, onSubmit }: Props) {
  const [shelfLife, setShelfLife] = useState(
    typeof ingredient.shelf_life_days === "number" ? String(ingredient.shelf_life_days) : ""
  );
  const [threshold, setThreshold] = useState(String(ingredient.minimum_threshold));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const unit = ingredient.unit;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const days = Number(shelfLife);
    const min = Number(threshold);
    if (shelfLife.trim() === "" || !Number.isInteger(days) || days < 1 || days > 3650) {
      setError("Shelf life must be a whole number of days, from 1 to 3650.");
      return;
    }
    if (threshold.trim() === "" || Number.isNaN(min) || min < 0) {
      setError("Low-stock level must be 0 or more.");
      return;
    }

    setSaving(true);
    const message = await onSubmit({ shelf_life_days: days, minimum_threshold: min });
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
          <h2 className="text-xl font-bold text-neutral-900">{ingredient.name}</h2>
          <p className="text-sm text-neutral-600">
            In stock now: {Number(ingredient.total_stock)} {unit}
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="ing_shelf_life" className="text-sm font-medium text-neutral-700">
            Shelf life (days)
          </label>
          <input
            id="ing_shelf_life"
            type="number"
            step={1}
            min={1}
            max={3650}
            required
            value={shelfLife}
            onChange={(e) => setShelfLife(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
          <p className="text-xs text-neutral-600">
            Every new batch expires this many days after it is received. Batches already in stock keep
            their current expiration date.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="ing_threshold" className="text-sm font-medium text-neutral-700">
            Low-stock level ({unit})
          </label>
          <input
            id="ing_threshold"
            type="number"
            step="any"
            min={0}
            required
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
          <p className="text-xs text-neutral-600">
            Flagged as Low Stock when the usable stock drops below this amount. 0 turns the warning off.
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
