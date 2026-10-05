/** Must match the backend exactly: side-dish request logging only works for this category. */
export const SIDE_DISHES_CATEGORY = "Side Dishes";

/** Suggested categories, in the order tabs should appear. */
export const DEFAULT_CATEGORIES = [
  "Unli Sets",
  "Side Dishes",
  "Pork",
  "Beef",
  "Grilled Chicken",
  "King & Queen's Favorite",
  "Seafood Paluto",
  "Sauces",
];

/** Known categories first (in the list order above), then any new ones A to Z. */
export function sortCategories(categories: string[]): string[] {
  const unique = Array.from(new Set(categories));
  return unique.sort((a, b) => {
    const ia = DEFAULT_CATEGORIES.indexOf(a);
    const ib = DEFAULT_CATEGORIES.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
}

/** 0 shows as "Included" because most items come with a package. */
export function formatPrice(price: number): string {
  if (price === 0) return "Included";
  return `₱${price.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}