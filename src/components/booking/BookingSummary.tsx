// src/components/booking/BookingSummary.tsx
import { formatBookingDate, formatBookingTime } from "@/lib/booking-format";

interface Props {
  name: string;
  date: string;
  time: string;
  partySize: number | string;
  specialRequests?: string | null;
}

/** Read-only booking details. Used by the pop-up shown after a pencil booking is sent. */
export default function BookingSummary({ name, date, time, partySize, specialRequests }: Props) {
  const rows: Array<[string, string]> = [
    ["Name", name],
    ["Date", formatBookingDate(date)],
    ["Time", formatBookingTime(time)],
    ["Guests", String(partySize)],
  ];
  if (specialRequests) rows.push(["Requests", specialRequests]);

  return (
    <dl className="divide-y divide-gold/15 border-y border-gold/15">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr] sm:gap-6">
          <dt className="text-[12px] font-medium uppercase tracking-[0.16em] text-paper/60">{label}</dt>
          <dd className="min-w-0 whitespace-pre-line text-pretty font-serif-display text-lg leading-snug text-paper [overflow-wrap:anywhere]">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
