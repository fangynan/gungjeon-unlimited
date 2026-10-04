"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { MenuItem, UserProfile } from "@/types";

export default function AdminHome() {
  const [me, setMe] = useState<string>("loading...");
  const [menuCount, setMenuCount] = useState<string>("loading...");

  useEffect(() => {
    apiFetch<UserProfile>("/api/auth/me").then((res) =>
      setMe(res.success ? JSON.stringify(res.data) : `ERROR: ${res.error}`)
    );
    apiFetch<MenuItem[]>("/api/menu").then((res) =>
      setMenuCount(res.success ? `${res.data?.length ?? 0} items` : `ERROR: ${res.error}`)
    );
  }, []);

  return (
    <main className="space-y-2 p-8">
      <h1 className="text-2xl font-bold">apiFetch test (temporary)</h1>
      <p>Me: {me}</p>
      <p>Menu: {menuCount}</p>
    </main>
  );
}