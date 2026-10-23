import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pencil Booking | Gungjeon Unlimited",
  description:
    "Pencil in your visit to Gungjeon Unlimited in Palasan, Valenzuela City. Send your details online and arrive within 15 minutes of your booking time.",
};

export default function PencilBookingLayout({ children }: { children: ReactNode }) {
  return children;
}
