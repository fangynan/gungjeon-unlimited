// src/app/(public)/page.tsx  (REPLACES the old home page; header/footer come from (public)/layout.tsx)
import { Noto_Serif_KR } from "next/font/google";
import Hero from "@/components/home/Hero";
import BrandStory from "@/components/home/BrandStory";
import MenuHighlights from "@/components/home/MenuHighlights";
import VibeBanner from "@/components/home/VibeBanner";
import MotionProvider from "@/components/home/MotionProvider";

// Serif for headings (Hangul-capable). preload:false because the Korean glyph set is large.
const serif = Noto_Serif_KR({
  weight: ["400", "600"],
  display: "swap",
  preload: false,
  variable: "--font-noto-serif-kr",
});

export default function PublicHomePage() {
  return (
    // (public)/layout.tsx already provides <main id="main">, so this is a plain div.
    <div className={`${serif.variable} font-sans`}>
      <MotionProvider>
        <Hero />
        <BrandStory />
        <MenuHighlights />
        <VibeBanner />
        {/* Part 3 goes here */}
      </MotionProvider>
    </div>
  );
}

