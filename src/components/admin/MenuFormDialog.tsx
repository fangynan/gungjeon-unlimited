"use client";

import { useState, type FormEvent } from "react";
import { DEFAULT_CATEGORIES, sortCategories } from "@/lib/menu-categories";

export interface MenuFormValues {
  name: string;
  description: string | null;
  category: string;
  price: number;
  is_available: boolean;
}

interface Props {
  title: string;
  submitLabel: string;
  initial?: MenuFormValues;
  /** Categories already used by existing items (so new ones show up in the dropdown). */
  existingCategories: string[];
  onClose: () => void;
  /** Return an error message to show in the dialog, or null when it worked. */
  onSubmit: (values: MenuFormValues) => Promise<string | null>;
}

const NEW_CATEGORY = "__new__";

export default function MenuFormDialog({
  title,
  submitLabel,
  initial,
  existingCategories,
  onClose,
  onSubmit,
}: Props) {
  const categoryOptions = sortCategories([...DEFAULT_CATEGORIES, ...existingCategories]);

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryChoice, setCategoryChoice] = useState(
    initial?.category ?? categoryOptions[0]
  );
  const [newCategory, setNewCategory] = useState("");
  const [price, setPrice] = useState(String(initial?.price ?? 0));
  const [isAvailable, setIsAvailable] = useState(initial?.is_available ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const category = categoryChoice === NEW_CATEGORY ? newCategory.trim() : categoryChoice;
    if (!category) {
      setError("Please enter a category name.");
      return;
    }

    const priceNumber = Number(price);
    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      setError("Price must be 0 or more. Use 0 for items included in a package.");
      return;
    }

    setSaving(true);
    const message = await onSubmit({
      name: name.trim(),
      description: description.trim() === "" ? null : description.trim(),
      category,
      price: priceNumber,
      is_available: isAvailable,
    });
    setSaving(false);

    if (message) setError(message);
    else onClose();
  }

  const inputClass =
    "w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-lg"
      >
        <h2 className="text-xl font-bold text-neutral-900">{title}</h2>

        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium text-neutral-700">
            Name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="category" className="text-sm font-medium text-neutral-700">
            Category
          </label>
          <select
            id="category"
            value={categoryChoice}
            onChange={(e) => setCategoryChoice(e.target.value)}
            className={inputClass}
          >
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={NEW_CATEGORY}>+ New category...</option>
          </select>
          {categoryChoice === NEW_CATEGORY && (
            <input
              placeholder="New category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className={`${inputClass} mt-2`}
            />
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="price" className="text-sm font-medium text-neutral-700">
            Price (₱) <span className="font-normal text-neutral-500">(0 = Included)</span>
          </label>
          <input
            id="price"
            type="number"
            min={0}
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="description" className="text-sm font-medium text-neutral-700">
            Description (optional)
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
          />
          Available (shown on the public menu)
        </label>

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