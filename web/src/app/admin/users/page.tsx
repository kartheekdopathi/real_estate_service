"use client";

import { FormEvent, useEffect, useState } from "react";

type RoleOption = { id: number; roleName: string };

type UserItem = {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  roleId: number;
  isInternal: boolean;
  subscriptionPlan: "FREE" | "PRO" | "PREMIUM";
  leadCredits: number;
  subscriptionEndsAt?: string | null;
  role: {
    id: number;
    roleName: string;
  };
};

export default function AdminUsersPage() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [search, setSearch] = useState("");
  const [roleId, setRoleId] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const loadRoles = async () => {
    const response = await fetch("/api/roles", { credentials: "include" });
    const data = await response.json();
    if (response.ok) setRoles(data.roles ?? []);
  };

  const loadData = async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    if (roleId) params.set("roleId", roleId);

    const response = await fetch(`/api/admin/users?${params.toString()}`, { credentials: "include" });
    const data = await response.json();

    if (response.ok) {
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    }
  };

  useEffect(() => {
    void loadRoles();
  }, []);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, reloadKey]);

  const onFilter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setReloadKey((prev) => prev + 1);
  };

  const onResetFilters = () => {
    setSearch("");
    setRoleId("");
    setPage(1);
    setReloadKey((prev) => prev + 1);
  };

  const onRefreshFilters = () => {
    setPage(1);
    setReloadKey((prev) => prev + 1);
  };

  const onChangeRole = async (id: number, nextRoleId: string) => {
    if (!nextRoleId) return;

    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ roleId: Number(nextRoleId) }),
    });

    if (response.ok) {
      await loadData();
    }
  };

  const onDelete = async (id: number) => {
    const response = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (response.ok) {
      await loadData();
    }
  };

  const onChangePlan = async (id: number, plan: "FREE" | "PRO" | "PREMIUM") => {
    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ subscriptionPlan: plan, subscriptionDays: 30 }),
    });

    if (response.ok) {
      await loadData();
    }
  };

  const onToggleInternal = async (id: number, nextValue: boolean) => {
    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isInternal: nextValue }),
    });

    if (response.ok) {
      await loadData();
    }
  };

  const onAdjustCredits = async (id: number, leadCreditsDelta: number) => {
    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ leadCreditsDelta }),
    });

    if (response.ok) {
      await loadData();
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section>
      <h1 className="text-xl font-bold">Users</h1>
      <p className="mt-1 text-xs text-slate-300">User listing with filter, pagination, edit and delete.</p>

      <form onSubmit={onFilter} className="mt-4 rounded-xl border border-white/10 bg-slate-900/40 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Search & Filters</p>
        <div className="grid gap-2 md:grid-cols-[2fr_1fr_auto_auto_auto]">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Search users</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, email, phone"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Role</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="">All roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.roleName}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="h-10 self-end rounded bg-blue-600 px-4 text-sm font-semibold">Apply</button>
          <button
            type="button"
            onClick={onResetFilters}
            title="Reset filters"
            className="h-10 w-10 self-end rounded border border-slate-700 bg-slate-950 text-sm text-slate-300"
          >
            ⟲
          </button>
          <button
            type="button"
            onClick={onRefreshFilters}
            title="Refresh results"
            className="h-10 w-10 self-end rounded border border-slate-700 bg-slate-950 text-sm text-slate-300"
          >
            ↻
          </button>
        </div>
      </form>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left">
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Email</th>
              <th className="px-2 py-2">Role</th>
              <th className="px-2 py-2">Internal</th>
              <th className="px-2 py-2">Plan</th>
              <th className="px-2 py-2">Lead Credits</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-800">
                <td className="px-2 py-2">{item.name ?? "-"}</td>
                <td className="px-2 py-2">{item.email}</td>
                <td className="px-2 py-2">
                  <select
                    value={String(item.roleId)}
                    onChange={(e) => void onChangeRole(item.id, e.target.value)}
                    className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
                  >
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2">
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={item.isInternal}
                      onChange={(e) => void onToggleInternal(item.id, e.target.checked)}
                    />
                    <span>{item.isInternal ? "Yes" : "No"}</span>
                  </label>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={item.subscriptionPlan}
                      onChange={(e) => void onChangePlan(item.id, e.target.value as "FREE" | "PRO" | "PREMIUM")}
                      className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
                    >
                      <option value="FREE">FREE</option>
                      <option value="PRO">PRO</option>
                      <option value="PREMIUM">PREMIUM</option>
                    </select>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <span>{item.leadCredits}</span>
                    <button
                      onClick={() => void onAdjustCredits(item.id, 5)}
                      className="rounded bg-emerald-600 px-2 py-1 text-xs"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => void onAdjustCredits(item.id, -5)}
                      className="rounded bg-amber-600 px-2 py-1 text-xs"
                    >
                      -5
                    </button>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <button onClick={() => void onDelete(item.id)} className="rounded bg-rose-600 px-2 py-1 text-xs">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm">
        <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded bg-slate-700 px-3 py-1 disabled:opacity-40">
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="rounded bg-slate-700 px-3 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
}
