// src/components/booking/BookingFrame.tsx
import type { ReactNode } from "react";

/** Gold-hairline frame, the same treatment as the info board on the Contact page. */
export default function BookingFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative bg-gradient-to-br from-gold via-gold/25 to-gold/80 p-px shadow-[0_0_90px_-35px_rgba(201,164,92,0.45)] ${className}`}
    >
      <div className="bg-[#0e0c0a] px-5 py-8 sm:px-10 sm:py-10">{children}</div>
    </div>
  );
}
