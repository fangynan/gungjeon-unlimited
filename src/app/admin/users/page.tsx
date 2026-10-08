"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import AddUserDialog, { type NewUserValues } from "@/components/admin/AddUserDialog";
import EditUserDialog, { type EditUserValues } from "@/components/admin/EditUserDialog";
import type { UserProfile } from "@/types";

const ROLE_LABEL: Record<string, string> = { admin: "Admin", staff: "Staff" };

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  staff: "bg-neutral-200 text-neutral-700",
};

export default function UsersPage() {
  const [me, setMe] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    // First find out who is signed in. Only admins may see this page.
    const meRes = await apiFetch<UserProfile>("/api/auth/me");
    if (!meRes.success || !meRes.data) {
      setError(meRes.error ?? "Could not check your account.");
      setLoading(false);
      return;
    }
    setMe(meRes.data);
    if (meRes.data.role !== "admin") {
      setLoading(false);
      return;
    }

    const res = await apiFetch<UserProfile[]>("/api/admin/staff");
    if (res.success && res.data) {
      setUsers(res.data);
      setError(null);
    } else {
      setError(res.error ?? "Could not load the accounts.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createUser(values: NewUserValues): Promise<string | null> {
    const res = await apiFetch<UserProfile>("/api/admin/staff", {
      method: "POST",
      json: values,
    });
    if (!res.success) return res.error ?? "Could not create the account.";
    await load();
    return null;
  }

  async function updateUser(values: EditUserValues): Promise<string | null> {
    if (!editing) return "No account selected.";

    // Only send what actually changed.
    const changes: { full_name?: string; role?: "admin" | "staff" } = {};
    if (values.full_name !== (editing.full_name ?? "")) changes.full_name = values.full_name;
    if (values.role !== editing.role) changes.role = values.role;
    if (Object.keys(changes).length === 0) return null; // nothing to save

    const res = await apiFetch<UserProfile>(`/api/admin/staff/${editing.id}`, {
      method: "PATCH",
      json: changes,
    });
    if (!res.success) return res.error ?? "Could not update the account.";
    await load();
    return null;
  }

   async function setActive(user: UserProfile, active: boolean) {
    const who = user.full_name || user.email;
    if (
      !active &&
      !window.confirm(
        `Deactivate ${who}?\n\nThey will not be able to sign in until you reactivate them.`
      )
    ) {
      return;
    }
    setActionError(null);
    setBusyId(user.id);
    const res = await apiFetch<UserProfile>(`/api/admin/staff/${user.id}`, {
      method: "PATCH",
      json: { is_active: active },
    });
    setBusyId(null);
    if (!res.success) {
      setActionError(res.error ?? "Could not change the status.");
      return;
    }
    await load();
  }

  async function deleteUser(user: UserProfile) {
    const who = user.full_name || user.email;
    if (
      !window.confirm(
        `Delete ${who} permanently?\n\nTheir login is removed and this cannot be undone. Their past inventory activity stays in the log.\n\nIf you only want to stop them from signing in, use Deactivate instead.`
      )
    ) {
      return;
    }
    setActionError(null);
    setBusyId(user.id);
    const res = await apiFetch<{ id: string }>(`/api/admin/staff/${user.id}`, {
      method: "DELETE",
    });
    setBusyId(null);
    if (!res.success) {
      setActionError(res.error ?? "Could not delete the account.");
      return;
    }
    await load();
  }

  // Staff (or anyone who is not an admin) gets a short message instead of the list.
  if (!loading && me && me.role !== "admin") {
    return (
      <main className="space-y-4 p-8">
        <h1 className="text-3xl font-bold text-neutral-900">User Management</h1>
        <p className="rounded-lg border border-neutral-300 p-4 text-neutral-700">
          Only the owner or manager can manage user accounts.
        </p>
      </main>
    );
  }

  return (
    <main className="space-y-4 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">User Management</h1>
          <p className="text-neutral-700">
            The owner, managers and employees who can sign in to this system.
          </p>
        </div>
        {me?.role === "admin" && (
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            + Add User
          </button>
        )}
      </div>

        {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{error}</p>
      )}
      {actionError && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">
          {actionError}
        </p>
      )}

      {loading ? (
        <p className="text-neutral-600">Loading accounts...</p>
      ) : users.length === 0 && !error ? (
        <p className="rounded-lg border border-neutral-300 p-4 text-neutral-600">
          No accounts yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-300">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-neutral-100 text-neutral-700">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-neutral-200">
                  <td className="p-3 font-medium text-neutral-900">
                    {user.full_name || "—"}
                    {me && user.id === me.id && (
                      <span className="ml-2 rounded bg-neutral-800 px-2 py-0.5 text-xs font-semibold text-white">
                        You
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-neutral-800">{user.email}</td>
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${
                        ROLE_BADGE[user.role] ?? "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {ROLE_LABEL[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setEditing(user)}
                        className="rounded-md border border-neutral-400 px-3 py-1 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
                      >
                        Edit
                      </button>
                      {me && user.id === me.id ? (
                        <span className="text-xs text-neutral-600">
                          You can&apos;t deactivate or delete your own account.
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => setActive(user, !user.is_active)}
                            disabled={busyId === user.id}
                            className="rounded-md border border-neutral-400 px-3 py-1 text-xs font-semibold text-neutral-900 hover:bg-neutral-100 disabled:opacity-60"
                          >
                            {user.is_active ? "Deactivate" : "Reactivate"}
                          </button>
                          <button
                            onClick={() => deleteUser(user)}
                            disabled={busyId === user.id}
                            className="rounded-md border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddUserDialog onClose={() => setShowAdd(false)} onSubmit={createUser} />}
      {editing && (
        <EditUserDialog
          user={editing}
          isSelf={!!me && editing.id === me.id}
          onClose={() => setEditing(null)}
          onSubmit={updateUser}
        />
      )}
    </main>
  );
}