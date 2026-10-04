"use client";

import { useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { ApiResponse, UserProfile } from "@/types";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = supabaseBrowser();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    // Ask our own API who this is and what role they have.
    const res = await fetch("/api/auth/me");
    const body = (await res.json()) as ApiResponse<UserProfile>;

    if (!body.success || !body.data) {
      await supabase.auth.signOut();
      setError(body.error ?? "Could not load your account.");
      setLoading(false);
      return;
    }

    if (body.data.role !== "admin" && body.data.role !== "staff") {
      await supabase.auth.signOut();
      setError("This account is not allowed to use the staff portal.");
      setLoading(false);
      return;
    }

    // Go back to the page they tried to open, but only if it is inside /admin.
    const next = new URLSearchParams(window.location.search).get("next");
    const destination = next && next.startsWith("/admin") ? next : "/admin";
    window.location.assign(destination);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Gungjeon Unlimited</h1>
          <p className="text-sm text-neutral-500">Staff &amp; Management Sign In</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-neutral-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Log in"}
        </button>
      </form>
    </main>
  );
}