/** Must match public.restaurant_today() in 001_schema.sql. */
export const RESTAURANT_TIME_ZONE = "Asia/Manila";

/** Today's calendar date in restaurant time, as `YYYY-MM-DD`. */
export function restaurantToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: RESTAURANT_TIME_ZONE }).format(new Date());
}

/** `YYYY-MM-DD` plus a whole number of days (calendar arithmetic, no timezone shifting). */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (both `YYYY-MM-DD`); negative if `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}
