"use client";

import { useState, type FormEvent } from "react";
import { addDays, restaurantToday } from "@/lib/api/dates";
import { formatDate } from "@/lib/inventory-status";
import type { IngredientWithStock } from "@/types";

export interface BatchFormValues {
  ingredient_id: string;
  batch_number: string;
  quantity: number;
}

export interface NewIngredientValues {
  name: string;
  unit: string;
  shelf_life_days: number;
  minimum_threshold: number;
}

interface Props {
  ingredients: IngredientWithStock[];
  /** Only admins may create ingredients (the backend enforces this too). */
  canCreateIngredient: boolean;
  onClose: () => void;
  onCreateIngredient: (
    values: NewIngredientValues
  ) => Promise<{ id: string | null; error: string | null }>;
  /** Return an error message to show in the dialog, or null when it worked. */
  onSubmit: (values: BatchFormValues) => Promise<string | null>;
}

const NEW_OPTION = "__new__";

export default function AddInventoryDialog({
  ingredients,
  canCreateIngredient,
  onClose,
  onCreateIngredient,
  onSubmit,
}: Props) {
  const [ingredientId, setIngredientId] = useState("");
  const [creating, setCreating] = useState(canCreateIngredient && ingredients.length === 0);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newShelfLife, setNewShelfLife] = useState("");
  const [newThreshold, setNewThreshold] = useState("0");
  const [creatingBusy, setCreatingBusy] = useState(false);

  const [batchNumber, setBatchNumber] = useState("");
  const [quantity, setQuantity] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = ingredients.find((i) => i.id === ingredientId);
  const selectedUnit = selected?.unit;
  const shelfLife = selected?.shelf_life_days ?? null;
  const missingShelfLife = selected !== undefined && shelfLife === null;
  // A new batch is received today, so it expires today + the shelf life.
  const expiresOn = shelfLife !== null ? addDays(restaurantToday(), shelfLife) : null;
  const noIngredientsForStaff = !canCreateIngredient && ingredients.length === 0;

  function handleSelect(value: string) {
    setError(null);
    if (value === NEW_OPTION) {
      setCreating(true);
      setIngredientId("");
    } else {
      setCreating(false);
      setIngredientId(value);
    }
  }

  async function handleCreateIngredient() {
    setError(null);
    const threshold = Number(newThreshold);
    const days = Number(newShelfLife);
    if (newName.trim() === "" || newUnit.trim() === "") {
      setError("Enter the ingredient name and unit.");
      return;
    }
    if (newShelfLife.trim() === "" || !Number.isInteger(days) || days < 1 || days > 3650) {
      setError("Shelf life must be a whole number of days, from 1 to 3650.");
      return;
    }
    if (Number.isNaN(threshold) || threshold < 0) {
      setError("Low-stock level must be 0 or more.");
      return;
    }

    setCreatingBusy(true);
    const result = await onCreateIngredient({
      name: newName.trim(),
      unit: newUnit.trim(),
      shelf_life_days: days,
      minimum_threshold: threshold,
    });
    setCreatingBusy(false);

    if (result.error || !result.id) {
      setError(result.error ?? "Could not create the ingredient.");
      return;
    }
    setIngredientId(result.id);
    setCreating(false);
    setNewName("");
    setNewUnit("");
    setNewShelfLife("");
    setNewThreshold("0");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!ingredientId) {
      setError("Choose an ingredient (or create the new one first).");
      return;
    }
    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }
    if (missingShelfLife) {
      setError("This ingredient has no shelf life yet. Ask an admin to set one first.");
      return;
    }

    setSaving(true);
    const message = await onSubmit({
      ingredient_id: ingredientId,
      batch_number: batchNumber.trim(),
      quantity: qty,
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
        <h2 className="text-xl font-bold text-neutral-900">Add Inventory</h2>

        {noIngredientsForStaff && (
          <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
            No ingredients exist yet. Ask the owner or manager to create one first.
          </p>
        )}

        <div className="space-y-1">
          <label htmlFor="ingredient" className="text-sm font-medium text-neutral-700">
            Ingredient
          </label>
          <select
            id="ingredient"
            value={creating ? NEW_OPTION : ingredientId}
            onChange={(e) => handleSelect(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          >
            <option value="" disabled>
              Choose an ingredient...
            </option>
            {ingredients.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.unit})
              </option>
            ))}
            {canCreateIngredient && <option value={NEW_OPTION}>+ New ingredient...</option>}
          </select>
        </div>

        {creating && (
          <div className="space-y-3 rounded-md border border-neutral-300 bg-neutral-50 p-3">
            <p className="text-sm font-semibold text-neutral-800">New ingredient</p>
            <input
              placeholder="Name, e.g. Pork Belly"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
            />
            <input
              placeholder="Unit, e.g. kg, grams, liters, packs"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
            />
            <div className="space-y-1">
              <label htmlFor="shelf_life" className="text-xs text-neutral-600">
                Shelf life in days (counted from the date received)
              </label>
              <input
                id="shelf_life"
                type="number"
                step={1}
                min={1}
                max={3650}
                placeholder="e.g. 5"
                value={newShelfLife}
                onChange={(e) => setNewShelfLife(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="threshold" className="text-xs text-neutral-600">
                Low-stock warning level (0 = no warning)
              </label>
              <input
                id="threshold"
                type="number"
                min={0}
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateIngredient}
              disabled={creatingBusy}
              className="rounded-md border border-neutral-400 px-3 py-1.5 text-sm font-semibold hover:bg-neutral-100 disabled:opacity-60"
            >
              {creatingBusy ? "Creating..." : "Create ingredient"}
            </button>
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="batch_number" className="text-sm font-medium text-neutral-700">
            Batch number
          </label>
          <input
            id="batch_number"
            required
            placeholder="e.g. B-2026-091"
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="quantity" className="text-sm font-medium text-neutral-700">
            Quantity{selectedUnit ? ` (${selectedUnit})` : ""}
          </label>
          <input
            id="quantity"
            type="number"
            step="any"
            min={0}
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </div>

        {missingShelfLife && (
          <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
            This ingredient has no shelf life yet, so an expiration date cannot be worked out. Ask an
            admin to set one under Stock Levels.
          </p>
        )}
        {expiresOn && shelfLife !== null && (
          <p className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-800">
            Expires <span className="font-semibold">{formatDate(expiresOn)}</span>{" "}
            <span className="text-neutral-600">
              ({shelfLife} {shelfLife === 1 ? "day" : "days"} from today)
            </span>
          </p>
        )}

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
            disabled={saving || noIngredientsForStaff || missingShelfLife}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Add batch"}
          </button>
        </div>
      </form>
    </div>
  );


}