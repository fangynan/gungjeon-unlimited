// src/lib/booking-format.ts
// Display helpers shared by the Pencil Booking pages. Both inputs are restaurant-local values,
// so nothing here converts time zones.

/** `2026-10-25` -> "Sunday, 25 October 2026". UTC keeps a calendar date from shifting a day. */
export function formatBookingDate(date: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** `19:00` or `19:00:00` -> "7:00 PM". */
export function formatBookingTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/** Minutes since local midnight right now, in restaurant time (client-safe). */
export function restaurantNowMinutes(timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

/**
 * True once `graceMinutes` have passed since the booking time. The date and time are
 * restaurant-local (Asia/Manila, UTC+8 all year: the Philippines has no daylight saving).
 */
export function isPastGrace(date: string, time: string, graceMinutes: number, nowMs: number = Date.now()): boolean {
  const start = Date.parse(`${date}T${time.slice(0, 5)}:00+08:00`);
  if (Number.isNaN(start)) return false;
  return nowMs > start + graceMinutes * 60_000;
}
