"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { UserProfile } from "@/types";

const OPERATION = [
  { label: "Dashboard", href: "/admin" },
  { label: "Inventory", href: "/admin/inventory" },
  { label: "Table Management", href: "/admin/tables" },
];

const ADMINISTRATION = [
  { label: "Menu Management", href: "/admin/menu" },
  { label: "User Management", href: "/admin/users" },
];

function NavLink({
  label,
  href,
  onNavigate,
}: {
  label: string;
  href: string;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`block rounded-md px-3 py-2 text-sm ${
        active
          ? "bg-red-700 font-semibold text-white"
          : "text-neutral-800 hover:bg-neutral-300"
      }`}
    >
      {label}
    </Link>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // Only matters on phones: is the slide-in menu open?
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    apiFetch<UserProfile>("/api/auth/me").then((res) => {
      if (res.success && res.data) setProfile(res.data);
    });
  }, []);

  async function handleLogout() {
    await supabaseBrowser().auth.signOut();
    window.location.assign("/login");
  }

  const isAdmin = profile?.role === "admin";
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="flex min-h-screen bg-white text-neutral-900">
      {/* Dark backdrop behind the slide-in menu (phones only). Tap it to close the menu. */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-neutral-300 bg-neutral-200 transition-transform md:static md:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between border-b border-neutral-300 p-4">
          <p className="text-lg font-bold leading-tight text-neutral-900">
            GUNGJEON
            <br />
            UNLIMITED
          </p>
          <button
            onClick={closeMenu}
            aria-label="Close menu"
            className="rounded-md px-2 py-1 text-neutral-700 hover:bg-neutral-300 md:hidden"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto p-3">
          <div>
            <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-neutral-500">
              OPERATION
            </p>
            {OPERATION.map((item) => (
              <NavLink key={item.href} {...item} onNavigate={closeMenu} />
            ))}
          </div>

          {isAdmin && (
            <div>
              <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-neutral-500">
                ADMINISTRATION
              </p>
              {ADMINISTRATION.map((item) => (
                <NavLink key={item.href} {...item} onNavigate={closeMenu} />
              ))}
            </div>
          )}
        </nav>

        <div className="space-y-2 border-t border-neutral-300 p-4">
          <p className="text-xs font-semibold text-neutral-600">
            {profile ? (isAdmin ? "OWNER/MANAGEMENT" : "STAFF") : "..."}
          </p>
          <button
            onClick={handleLogout}
            className="w-full rounded-md border border-neutral-400 bg-white px-3 py-2 text-sm hover:bg-neutral-100"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Top bar with a Menu button (phones only) */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-300 bg-white px-4 py-3 md:hidden">
          <p className="text-base font-bold text-neutral-900">GUNGJEON UNLIMITED</p>
          <button
            onClick={() => setMenuOpen(true)}
            className="rounded-md border border-neutral-400 px-3 py-1.5 text-sm font-semibold hover:bg-neutral-100"
          >
            Menu
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}