"use client";

import { FormEvent, useEffect, useState } from "react";

type PermissionItem = {
  id: string;
  resource: string;
  action: "VIEW" | "CREATE" | "EDIT" | "DELETE";
  active: boolean;
};

export default function AdminPermissionsPage() {
  const [items, setItems] = useState<PermissionItem[]>([]);
  const [resource, setResource] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const loadData = async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (resource) params.set("resource", resource);
    if (action) params.set("action", action);

    const response = await fetch(`/api/admin/permissions?${params.toString()}`, { credentials: "include" });
    const data = await response.json();

    if (response.ok) {
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    }
  };

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
    setResource("");
    setAction("");
    setPage(1);
    setReloadKey((prev) => prev + 1);
  };

  const onRefreshFilters = () => {
    setPage(1);
    setReloadKey((prev) => prev + 1);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section>
      <h1 className="text-xl font-bold">Permissions</h1>
      <p className="mt-1 text-xs text-slate-300">Resource-action matrix for RBAC.</p>

      <form onSubmit={onFilter} className="mt-4 rounded-xl border border-white/10 bg-slate-900/40 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Search & Filters</p>
        <div className="grid gap-2 md:grid-cols-[2fr_1fr_auto_auto_auto]">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Resource</label>
            <input
              value={resource}
              onChange={(e) => setResource(e.target.value)}
              placeholder="users, properties..."
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Action</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="">All actions</option>
              <option value="VIEW">VIEW</option>
              <option value="CREATE">CREATE</option>
              <option value="EDIT">EDIT</option>
              <option value="DELETE">DELETE</option>
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
              <th className="px-2 py-2">Resource</th>
              <th className="px-2 py-2">Action</th>
              <th className="px-2 py-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-800">
                <td className="px-2 py-2">{item.resource}</td>
                <td className="px-2 py-2">{item.action}</td>
                <td className="px-2 py-2">{item.active ? "Yes" : "No"}</td>
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
