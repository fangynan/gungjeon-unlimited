"use client";

import { useState, type FormEvent } from "react";
import type { StaffRole, UserProfile } from "@/types";

export interface EditUserValues {
  full_name: string;
  role: StaffRole;
}

interface Props {
  user: UserProfile;
  /** True when this is the signed-in admin's own account. */
  isSelf: boolean;
  onClose: () => void;
  /** Return an error message to show in the dialog, or null when it worked. */
  onSubmit: (values: EditUserValues) => Promise<string | null>;
}

export default function EditUserDialog({ user, isSelf, onClose, onSubmit }: Props) {
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [role, setRole] = useState<StaffRole>(user.role === "admin" ? "admin" : "staff");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (fullName.trim() === "") {
      setError("Please enter the person's name.");
      return;
    }

    setSaving(true);
    const message = await onSubmit({ full_name: fullName.trim(), role });
    setSaving(false);

    if (message) setError(message);
    else onClose();
  }

  const promoting = user.role !== "admin" && role === "admin";
  const demoting = user.role === "admin" && role === "staff";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-lg"
      >
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Edit User</h2>
          <p className="text-sm text-neutral-600">{user.email}</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit_user_name" className="text-sm font-medium text-neutral-700">
            Full name
          </label>
          <input
            id="edit_user_name"
            type="text"
            required
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="edit_user_email" className="text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="edit_user_email"
            type="email"
            disabled
            value={user.email}
            className="w-full rounded-md border border-neutral-300 bg-neutral-100 px-3 py-2 text-neutral-500"
          />
          <p className="text-xs text-neutral-600">The email can&apos;t be changed.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit_user_role" className="text-sm font-medium text-neutral-700">
            Role
          </label>
          <select
            id="edit_user_role"
            value={role}
            disabled={isSelf}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 disabled:bg-neutral-100 disabled:text-neutral-500"
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          {isSelf && (
            <p className="text-xs text-neutral-600">
              You can&apos;t remove your own Admin role. Ask another admin to do it.
            </p>
          )}
          {promoting && (
            <p className="rounded-md bg-yellow-50 p-3 text-xs text-yellow-800">
              This person will get full access: menu, tables, inventory and user accounts.
            </p>
          )}
          {demoting && (
            <p className="rounded-md bg-yellow-50 p-3 text-xs text-yellow-800">
              This person will lose access to Menu Management and User Management.
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
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}