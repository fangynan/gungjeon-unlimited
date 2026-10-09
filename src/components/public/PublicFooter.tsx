// src/components/public/PublicFooter.tsx
import Link from "next/link";
import { RESTAURANT } from "@/lib/restaurant-info";

const SNAP = "ease-[cubic-bezier(0.25,1,0.5,1)]";

const NAV = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Menu", href: "/menu" },
  { label: "Table Availability", href: "/table-availability" },
  { label: "Contact", href: "/contact" },
];

const linkClass = `inline-block rounded-none text-sm font-bold uppercase tracking-wider text-[#A0AEC0] transition-[color,transform] duration-100 ${SNAP} hover:translate-x-1 hover:text-[#ECC94B] active:scale-95`;

const labelClass =
  "font-mono text-[11px] font-bold uppercase tracking-widest text-[#E53E3E]";

export default function PublicFooter() {
  return (
    <footer className="rounded-none border-t border-red-600/30 bg-[#000000] text-white">
      {/* Brand banner */}
      <div className="border-b border-white/10 bg-[#1A1A1A]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-3xl font-extrabold uppercase leading-none tracking-wider sm:text-5xl">
              {RESTAURANT.name}
            </p>
            <p className="mt-3 max-w-md text-sm text-[#A0AEC0]">{RESTAURANT.tagline}</p>
          </div>
          <Link
            href="/table-availability"
            className={`group relative inline-flex h-12 items-center self-start overflow-hidden rounded-none bg-[#ECC94B] px-6 font-mono text-xs font-extrabold uppercase tracking-widest text-black transition-[color,transform] duration-100 ${SNAP} hover:text-white active:scale-95 sm:self-auto`}
          >
            <span
              aria-hidden
              className={`absolute inset-0 -translate-x-full bg-[#E53E3E] transition-transform duration-150 ${SNAP} group-hover:translate-x-0`}
            />
            <span className="relative">View Available Tables →</span>
          </Link>
        </div>
      </div>

      {/* Grid panels */}
      <div className="mx-auto max-w-6xl">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {/* Location */}
          <section className="space-y-3 border-b border-white/10 p-6 lg:border-r">
            <h2 className={labelClass}>// Location</h2>
            <address className="space-y-1 text-sm not-italic">
              <p className="font-extrabold uppercase tracking-wider">{RESTAURANT.addressLine1}</p>
              <p className="text-[#A0AEC0]">{RESTAURANT.addressLine2}</p>
            </address>
          </section>

          {/* Hours */}
          <section className="space-y-3 border-b border-white/10 p-6 lg:border-r">
            <h2 className={labelClass}>// Hours</h2>
            <dl className="space-y-2">
              <div className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
                <dt className="font-mono text-xs uppercase tracking-widest text-[#A0AEC0]">Daily</dt>
                <dd className="font-mono text-sm font-bold tracking-wider text-[#ECC94B]">
                  {RESTAURANT.hours}
                </dd>
              </div>
            </dl>
          </section>

          {/* Contact */}
          <section className="space-y-3 border-b border-white/10 p-6 lg:border-r">
            <h2 className={labelClass}>// Contact</h2>
            <ul className="space-y-2">
              <li>
                <a
                  href={`tel:${RESTAURANT.phoneLink}`}
                  className={`font-mono text-sm font-bold tracking-wider text-white transition-colors duration-100 ${SNAP} hover:text-[#ECC94B] active:scale-95 inline-block`}
                >
                  {RESTAURANT.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${RESTAURANT.email}`}
                  className={`break-all font-mono text-sm tracking-wider text-[#A0AEC0] transition-colors duration-100 ${SNAP} hover:text-[#ECC94B] active:scale-95 inline-block`}
                >
                  {RESTAURANT.email}
                </a>
              </li>
            </ul>
          </section>

          {/* Navigate */}
          <section className="space-y-3 border-b border-white/10 p-6">
            <h2 className={labelClass}>// Navigate</h2>
            <ul className="space-y-2">
              {NAV.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* System bar */}
      <div className="border-t border-white/10 bg-[#1A1A1A]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#A0AEC0] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {RESTAURANT.name}
          </p>
          <p className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-none bg-[#E53E3E]" aria-hidden />
            <span>System / Open daily {RESTAURANT.hours}</span>
          </p>
          <Link
            href="/login"
            className={`inline-block rounded-none border border-white/10 px-3 py-1 transition-[background-color,color,transform] duration-100 ${SNAP} hover:bg-[#E53E3E] hover:text-white active:scale-95`}
          >
            Staff login
          </Link>
        </div>
      </div>
    </footer>
  );
}