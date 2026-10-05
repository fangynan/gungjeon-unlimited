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

function NavLink({ label, href }: { label: string; href: string }) {
  const pathname = usePathname();
  const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  return (
    <Link
      href={href}
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

  return (
    <div className="flex min-h-screen bg-white text-neutral-900">
      <aside className="flex w-64 shrink-0 flex-col border-r border-neutral-300 bg-neutral-200">
        <div className="border-b border-neutral-300 p-4">
          <p className="text-lg font-bold leading-tight text-neutral-900">
            GUNGJEON
            <br />
            UNLIMITED
          </p>
        </div>

        <nav className="flex-1 space-y-6 p-3">
          <div>
            <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-neutral-500">
              OPERATION
            </p>
            {OPERATION.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>

          {isAdmin && (
            <div>
              <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-neutral-500">
                ADMINISTRATION
              </p>
              {ADMINISTRATION.map((item) => (
                <NavLink key={item.href} {...item} />
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

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}