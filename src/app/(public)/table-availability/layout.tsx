import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Table Availability | Gungjeon Unlimited",
  description: "See which tables are available at Gungjeon Unlimited right now, live.",
};

export default function TableAvailabilityLayout({ children }: { children: ReactNode }) {
  return children;
}