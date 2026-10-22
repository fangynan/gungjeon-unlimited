import { STOCK_BADGE, getStockLevel, type StockLevel } from "@/lib/inventory-status";
import type { IngredientWithStock } from "@/types";

interface Props {
  ingredients: IngredientWithStock[];
  /** Only admins can change shelf life and low-stock levels (the backend enforces this too). */
  isAdmin: boolean;
  onEdit: (ingredient: IngredientWithStock) => void;
}

// Stock state belongs to the INGREDIENT (all its usable batches added up), not to one batch,
// so it is shown here once per ingredient. This also covers ingredients that are fully used up,
// which have no batch row left to carry a badge.
const ORDER: Record<StockLevel, number> = {
  "Out of Stock": 0,
  "Low Stock": 1,
  "No Level Set": 2,
  "In Stock": 2,
};

const ROW_TINT: Partial<Record<StockLevel, string>> = {
  "Out of Stock": "bg-red-50",
  "Low Stock": "bg-yellow-50",
};

export default function StockLevels({ ingredients, isAdmin, onEdit }: Props) {
  if (ingredients.length === 0) return null;

  const sorted = [...ingredients].sort(
    (a, b) =>
      ORDER[getStockLevel(a)] - ORDER[getStockLevel(b)] || a.name.localeCompare(b.name)
  );
  const outCount = ingredients.filter((i) => getStockLevel(i) === "Out of Stock").length;
  const lowCount = ingredients.filter((i) => getStockLevel(i) === "Low Stock").length;
  const summary =
    outCount === 0 && lowCount === 0
      ? "Nothing is low or out of stock."
      : [
          outCount > 0 ? `${outCount} out of stock` : null,
          lowCount > 0 ? `${lowCount} low on stock` : null,
        ]
          .filter(Boolean)
          .join(", ");

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-neutral-900">Stock Levels</h2>
        <span className="text-sm text-neutral-600">{summary}</span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-neutral-300">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-neutral-100 text-neutral-700">
            <tr>
              <th className="p-3">Ingredient</th>
              <th className="p-3">In Stock</th>
              <th className="p-3">Low-Stock Level</th>
              <th className="p-3">Shelf Life</th>
              <th className="p-3">Status</th>
              {isAdmin && <th className="p-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((i) => {
              const level = getStockLevel(i);
              return (
                <tr
                  key={i.id}
                  className={`border-t border-neutral-200 ${ROW_TINT[level] ?? ""}`}
                >
                  <td className="p-3 font-medium text-neutral-900">{i.name}</td>
                  <td className="p-3">
                    {Number(i.total_stock)} {i.unit}
                  </td>
                  <td className="p-3">
                    {Number(i.minimum_threshold) > 0 ? `${Number(i.minimum_threshold)} ${i.unit}` : "Not set"}
                  </td>
                  <td className="p-3">
                    {typeof i.shelf_life_days !== "number" ? (
                      <span className="font-semibold text-red-700">Not set</span>
                    ) : (
                      `${i.shelf_life_days} ${i.shelf_life_days === 1 ? "day" : "days"}`
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${STOCK_BADGE[level]}`}>
                      {level === "No Level Set" ? "No low-stock level set" : level}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="p-3">
                      <button
                        onClick={() => onEdit(i)}
                        className="rounded-md border border-neutral-400 px-3 py-1 text-xs font-semibold hover:bg-neutral-100"
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
