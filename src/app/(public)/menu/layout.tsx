import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Menu | Gungjeon Unlimited",
  description:
    "Browse the Gungjeon Unlimited menu: Unli sets, side dishes, pork, beef, grilled chicken, seafood and sauces.",
};

export default function MenuLayout({ children }: { children: ReactNode }) {
  return children;
}