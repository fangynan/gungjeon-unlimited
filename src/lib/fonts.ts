// src/lib/fonts.ts
import { Noto_Serif_KR, Nanum_Pen_Script } from "next/font/google";

// Shared serif (Hangul-capable). preload:false because the Korean set is large.
export const serif = Noto_Serif_KR({
  weight: ["400", "600"],
  display: "swap",
  preload: false,
  variable: "--font-noto-serif-kr",
});

// Handwritten script, used only for the About page sign-off.
export const script = Nanum_Pen_Script({
  weight: "400",
  display: "swap",
  preload: false,
  variable: "--font-nanum-pen",
});
