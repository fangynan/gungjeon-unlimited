import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contact | Gungjeon Unlimited",
  description:
    "Find Gungjeon Unlimited at 11 M.S. Cruz, Palasan, Valenzuela City. Opening hours, directions, phone and email.",
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
