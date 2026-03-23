"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type RoleItem = { id: number; roleName: string };
type UserItem = {
  id: number;
  email: string;
  name: string | null;
  role?: { roleName: string };
};
type MenuItem = { id: number; key: string; title: string; path: string };

export default function MenuSettingsPage() {
  const searchParams = useSearchParams();
  const modeFromQuery = searchParams.get("mode") === "user" ? "user" : "role";
  const [mode, setMode] = useState<"role" | "user">(modeFromQuery);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [assigned, setAssigned] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [rolesRes, usersRes, menusRes] = await Promise.all([
          fetch("/api/admin/roles?page=1&limit=100", { credentials: "include" }),
          fetch("/api/admin/users?page=1&limit=100", { credentials: "include" }),
          fetch("/api/admin/menus?page=1&limit=100", { credentials: "include" }),
        ]);

        const [rolesJson, usersJson, menusJson] = await Promise.all([
          rolesRes.json().catch(() => null),
          usersRes.json().catch(() => null),
          menusRes.json().catch(() => null),
        ]);

        if (rolesRes.ok) setRoles((rolesJson?.items ?? []) as RoleItem[]);
        if (usersRes.ok) setUsers((usersJson?.items ?? []) as UserItem[]);
        if (menusRes.ok) setMenus((menusJson?.items ?? []) as MenuItem[]);

        if (!rolesRes.ok || !usersRes.ok || !menusRes.ok) {
          setMessage("Unable to load roles/users/menus. Please refresh.");
          setMessageType("error");
        }
      } catch {
        setMessage("Unable to load roles/users/menus. Please refresh.");
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
        mode === "role" ? `/api/admin/access/roles/${selectedId}/menus` : `/api/admin/access/users/${selectedId}/menus`;

      const response = await fetch(endpoint, { credentials: "include" });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data?.error ?? "Unable to load menu mapping");
        setMessageType("error");
        return;
      }

      const map: Record<string, boolean> = {};
      for (const item of data.menus ?? []) {
        map[String(item.menuId)] = Boolean(item.canView);
      }
      setAssigned(map);
      setMessage("");
      setMessageType(null);
    };

    void loadAssigned();
  }, [mode, selectedId]);

  const onSave = async () => {
    if (!selectedId) return;
    setSaving(true);

    const payload = {
      menus: menus.map((m) => ({
        menuId: m.id,
        canView: Boolean(assigned[String(m.id)]),
      })),
    };

    const endpoint =
      mode === "role" ? `/api/admin/access/roles/${selectedId}/menus` : `/api/admin/access/users/${selectedId}/menus`;

    const response = await fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setMessage(response.ok ? "Menu access saved successfully." : data?.error ?? "Save failed");
    setMessageType(response.ok ? "success" : "error");
    setSaving(false);

    window.setTimeout(() => {
      setMessage("");
      setMessageType(null);
    }, 2500);
  };

  return (
    <section>
      <h1 className="text-xl font-bold">Menu Settings</h1>
      <p className="mt-1 text-xs text-slate-300">Control dynamic menu visibility by role or user override.</p>

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

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {menus.map((menu) => (
          <label key={menu.id} className="flex items-center gap-2 rounded border border-slate-700 bg-slate-800 px-3 py-2 text-xs">
            <input
              type="checkbox"
              checked={Boolean(assigned[String(menu.id)])}
              onChange={(e) =>
                setAssigned((prev) => ({
                  ...prev,
                  [String(menu.id)]: e.target.checked,
                }))
              }
            />
            <span>
              {menu.title} <span className="text-slate-400">({menu.path})</span>
            </span>
          </label>
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
