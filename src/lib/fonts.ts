// src/lib/fonts.ts
import { Noto_Serif_KR } from "next/font/google";

// Shared serif (Hangul-capable). Used by PublicHeader and PublicFooter, which sit
// outside the home page's wrapper. preload:false because the Korean set is large.
export const serif = Noto_Serif_KR({
  weight: ["400", "600"],
  display: "swap",
  preload: false,
  variable: "--font-noto-serif-kr",
});
