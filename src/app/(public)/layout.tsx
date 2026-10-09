// src/app/(public)/layout.tsx
import type { ReactNode } from "react";
import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";

const STREET_CSS = `
  html {
    scrollbar-width: thin;
    scrollbar-color: #E53E3E #000000;
  }
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #000000;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
  }
  ::-webkit-scrollbar-thumb {
    background: #E53E3E;
    border-radius: 0;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #ECC94B;
  }
  ::selection {
    background: #E53E3E;
    color: #ECC94B;
  }
  ::-moz-selection {
    background: #E53E3E;
    color: #ECC94B;
  }
`;

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip rounded-none bg-[#000000] text-[#FFFFFF] selection:bg-[#E53E3E] selection:text-[#ECC94B]">
      <style>{STREET_CSS}</style>

      <a
        href="#main"
        className="fixed left-0 top-0 z-[60] -translate-y-full bg-[#ECC94B] px-4 py-3 font-mono text-xs font-extrabold uppercase tracking-widest text-black transition-transform duration-100 ease-[cubic-bezier(0.25,1,0.5,1)] focus:translate-y-0"
      >
        Skip to content
      </a>

      <PublicHeader />

      {/* pt matches fixed header: 28px status strip + 64px nav bar */}
      <main id="main" className="flex-1 pt-[92px]">
        {children}
      </main>

      <PublicFooter />
    </div>
  );
}