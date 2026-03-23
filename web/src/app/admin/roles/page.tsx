"use client";

import { FormEvent, useEffect, useState } from "react";

type RoleItem = {
  id: string;
  roleName: string;
  active: boolean;
};

export default function AdminRolesPage() {
  const [items, setItems] = useState<RoleItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);

    const response = await fetch(`/api/admin/roles?${params.toString()}`, { credentials: "include" });
    const data = await response.json();
    setLoading(false);

    if (response.ok) {
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, reloadKey]);

  const onSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setReloadKey((prev) => prev + 1);
  };

  const onResetFilters = () => {
    setSearch("");
    setPage(1);
    setReloadKey((prev) => prev + 1);
  };

  const onRefreshFilters = () => {
    setPage(1);
    setReloadKey((prev) => prev + 1);
  };

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roleName.trim()) return;

    const response = await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ roleName: roleName.trim().toUpperCase() }),
    });

    if (response.ok) {
      setRoleName("");
      await loadData();
    }
  };

  const onToggleActive = async (item: RoleItem) => {
    const response = await fetch(`/api/admin/roles/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ active: !item.active }),
    });

    if (response.ok) {
      await loadData();
    }
  };

  const onDelete = async (id: string) => {
    const response = await fetch(`/api/admin/roles/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (response.ok) {
      await loadData();
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section>
      <h1 className="text-xl font-bold">Roles</h1>
      <p className="mt-1 text-xs text-slate-300">Search, add, edit, delete with pagination.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={onSearch} className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Search & Filters</p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1">
              <label className="mb-1 block text-xs text-slate-400">Search role</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Role name"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <button type="submit" className="h-10 rounded bg-blue-600 px-4 text-sm font-semibold">Search</button>
            <button
              type="button"
              onClick={onResetFilters}
              title="Reset filters"
              className="h-10 w-10 rounded border border-slate-700 bg-slate-950 text-sm text-slate-300"
            >
              ⟲
            </button>
            <button
              type="button"
              onClick={onRefreshFilters}
              title="Refresh results"
              className="h-10 w-10 rounded border border-slate-700 bg-slate-950 text-sm text-slate-300"
            >
              ↻
            </button>
          </div>
        </form>

        <form onSubmit={onCreate} className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Create Role</p>
          <div className="flex gap-2">
            <input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="New role name"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <button className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold">Add</button>
          </div>
        </form>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left">
              <th className="px-2 py-2">Role</th>
              <th className="px-2 py-2">Active</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-800">
                <td className="px-2 py-2">{item.roleName}</td>
                <td className="px-2 py-2">{item.active ? "Yes" : "No"}</td>
                <td className="px-2 py-2">
                  <div className="flex gap-2">
                    <button onClick={() => void onToggleActive(item)} className="rounded bg-amber-600 px-2 py-1 text-xs">
                      {item.active ? "Disable" : "Enable"}
                    </button>
                    <button onClick={() => void onDelete(item.id)} className="rounded bg-rose-600 px-2 py-1 text-xs">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading ? <p className="mt-3 text-xs text-slate-400">Loading...</p> : null}

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
