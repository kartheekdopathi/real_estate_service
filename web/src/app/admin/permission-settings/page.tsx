"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type RoleItem = { id: number; roleName: string };
type UserItem = {
  id: number;
  email: string;
  name: string | null;
  role?: { roleName: string };
};
type PermissionItem = { id: number; resource: string; action: string };

export default function PermissionSettingsPage() {
  const searchParams = useSearchParams();
  const modeFromQuery = searchParams.get("mode") === "user" ? "user" : "role";
  const [mode, setMode] = useState<"role" | "user">(modeFromQuery);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [assigned, setAssigned] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [rolesRes, usersRes, permissionsRes] = await Promise.all([
          fetch("/api/admin/roles?page=1&limit=100", { credentials: "include" }),
          fetch("/api/admin/users?page=1&limit=100", { credentials: "include" }),
          fetch("/api/admin/permissions?page=1&limit=100", { credentials: "include" }),
        ]);

        const [rolesJson, usersJson, permissionsJson] = await Promise.all([
          rolesRes.json().catch(() => null),
          usersRes.json().catch(() => null),
          permissionsRes.json().catch(() => null),
        ]);

        if (rolesRes.ok) setRoles((rolesJson?.items ?? []) as RoleItem[]);
        if (usersRes.ok) setUsers((usersJson?.items ?? []) as UserItem[]);
        if (permissionsRes.ok) setPermissions((permissionsJson?.items ?? []) as PermissionItem[]);

        if (!rolesRes.ok || !usersRes.ok || !permissionsRes.ok) {
          setMessage("Unable to load roles/users/permissions. Please refresh.");
          setMessageType("error");
        }
      } catch {
        setMessage("Unable to load roles/users/permissions. Please refresh.");
        setMessageType("error");
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    const loadAssigned = async () => {
      if (!selectedId) {
        setAssigned({});
        return;
      }

      const endpoint =
        mode === "role"
          ? `/api/admin/access/roles/${selectedId}/permissions`
          : `/api/admin/access/users/${selectedId}/permissions`;

      const response = await fetch(endpoint, { credentials: "include" });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.error ?? "Unable to load permission mapping");
        setMessageType("error");
        return;
      }

      const map: Record<string, boolean> = {};
      for (const item of data.permissions ?? []) {
        map[String(item.permissionId)] = Boolean(item.canAccess);
      }
      setAssigned(map);
      setMessage("");
      setMessageType(null);
    };

    void loadAssigned();
  }, [mode, selectedId]);

  const grouped = useMemo(() => {
    const buckets: Record<string, PermissionItem[]> = {};

    for (const p of permissions) {
      if (!buckets[p.resource]) buckets[p.resource] = [];
      buckets[p.resource].push(p);
    }

    return Object.entries(buckets).sort((a, b) => a[0].localeCompare(b[0]));
  }, [permissions]);

  const onSave = async () => {
    if (!selectedId) return;
    setSaving(true);

    const payload = {
      permissions: permissions.map((p) => ({
        permissionId: p.id,
        canAccess: Boolean(assigned[String(p.id)]),
      })),
    };

    const endpoint =
      mode === "role"
        ? `/api/admin/access/roles/${selectedId}/permissions`
        : `/api/admin/access/users/${selectedId}/permissions`;

    const response = await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setMessage(response.ok ? "Permissions saved successfully." : data?.error ?? "Save failed");
    setMessageType(response.ok ? "success" : "error");
    setSaving(false);

    window.setTimeout(() => {
      setMessage("");
      setMessageType(null);
    }, 2500);
  };

  return (
    <section>
      <h1 className="text-xl font-bold">Permission Settings</h1>
      <p className="mt-1 text-xs text-slate-300">Assign VIEW/CREATE/EDIT/DELETE per role or per user.</p>

      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <select
          value={mode}
          onChange={(e) => {
            setMode(e.target.value as "role" | "user");
            setSelectedId("");
          }}
          className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="role">By Role</option>
          <option value="user">By User</option>
        </select>

        {mode === "role" ? (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="">Select role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.roleName}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="">Select user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {`${user.role?.roleName ?? "USER"} - ${user.name ? `${user.name} (${user.email})` : user.email}`}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={() => void onSave()}
          disabled={saving || !selectedId}
          className="rounded bg-emerald-600 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {grouped.map(([resource, list]) => (
          <div key={resource} className="rounded border border-slate-700 p-3">
            <h2 className="mb-2 text-sm font-semibold uppercase">{resource}</h2>
            <div className="grid gap-2 md:grid-cols-4">
              {list.map((permission) => (
                <label key={permission.id} className="flex items-center gap-2 rounded bg-slate-800 px-3 py-2 text-xs">
                  <input
                    type="checkbox"
                    checked={Boolean(assigned[String(permission.id)])}
                    onChange={(e) =>
                      setAssigned((prev) => ({
                        ...prev,
                        [String(permission.id)]: e.target.checked,
                      }))
                    }
                  />
                  <span>{permission.action}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {message ? (
        <p className={`mt-4 text-xs ${messageType === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
