// src/app/(public)/about/page.tsx
// Server component so the page keeps its metadata. The animated content is the
// client component below (which carries "use client").
import type { Metadata } from "next";
import AboutContent from "@/components/about/AboutContent";

export const metadata: Metadata = {
  title: "About | Gungjeon Unlimited",
  description:
    "The story behind Gungjeon Unlimited: a warm Korean BBQ table in Palasan, Valenzuela, where the banchan never stops.",
};

export default function AboutPage() {
  return <AboutContent />;
}
