"use client";

import { useState, type FormEvent } from "react";
import type { StaffRole } from "@/types";

export interface NewUserValues {
  full_name: string;
  email: string;
  password: string;
  role: StaffRole;
}

interface Props {
  onClose: () => void;
  /** Return an error message to show in the dialog, or null when it worked. */
  onSubmit: (values: NewUserValues) => Promise<string | null>;
}

export default function AddUserDialog({ onClose, onSubmit }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<StaffRole>("staff");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (fullName.trim() === "") {
      setError("Please enter the person's name.");
      return;
    }
    if (password.length < 8) {
      setError("The password must be at least 8 characters.");
      return;
    }
    if (password.length > 72) {
      setError("The password must be at most 72 characters.");
      return;
    }

    setSaving(true);
    const message = await onSubmit({
      full_name: fullName.trim(),
      email: email.trim(),
      password,
      role,
    });
    setSaving(false);

    if (message) setError(message);
    else onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-lg"
      >
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Add User</h2>
          <p className="text-sm text-neutral-600">
            The person can sign in right away with this email and password.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="user_name" className="text-sm font-medium text-neutral-700">
            Full name
          </label>
          <input
            id="user_name"
            type="text"
            required
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="user_email" className="text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="user_email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="user_password" className="text-sm font-medium text-neutral-700">
            Password (8 characters or more)
          </label>
          <div className="flex gap-2">
            <input
              id="user_password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-100"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <p className="text-xs text-neutral-600">
            Tell the person their password yourself. It can&apos;t be viewed again later.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="user_role" className="text-sm font-medium text-neutral-700">
            Role
          </label>
          <select
            id="user_role"
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          {role === "admin" ? (
            <p className="rounded-md bg-yellow-50 p-3 text-xs text-yellow-800">
              Admin has full access: menu, tables, inventory and user accounts. Choose this only for
              the owner or a manager.
            </p>
          ) : (
            <p className="text-xs text-neutral-600">
              Staff can view inventory, record stock changes and update table status.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Add User"}
          </button>
        </div>
      </form>
    </div>
  );
}