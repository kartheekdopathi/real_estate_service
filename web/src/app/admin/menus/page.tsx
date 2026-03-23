"use client";

import { FormEvent, useEffect, useState } from "react";

type MenuItem = {
  id: string;
  key: string;
  title: string;
  path: string;
  active: boolean;
  sortOrder: number;
};

export default function AdminMenusPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [keyName, setKeyName] = useState("");
  const [title, setTitle] = useState("");
  const [path, setPath] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadData = async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);

    const response = await fetch(`/api/admin/menus?${params.toString()}`, { credentials: "include" });
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
    if (!keyName.trim() || !title.trim() || !path.trim()) return;

    const response = await fetch("/api/admin/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ key: keyName.trim(), title: title.trim(), path: path.trim() }),
    });

    if (response.ok) {
      setKeyName("");
      setTitle("");
      setPath("");
      await loadData();
    }
  };

  const onToggleActive = async (item: MenuItem) => {
    const response = await fetch(`/api/admin/menus/${item.id}`, {
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
    const response = await fetch(`/api/admin/menus/${id}`, {
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
      <h1 className="text-xl font-bold">Menus</h1>
      <p className="mt-1 text-xs text-slate-300">Dynamic menu master and CRUD.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <form onSubmit={onSearch} className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Search & Filters</p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1">
              <label className="mb-1 block text-xs text-slate-400">Search menu</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Key, title, path"
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Create Menu</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Menu key</label>
              <input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="key"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="title"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-slate-400">Path</label>
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/admin/new-page"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button className="mt-2 w-full rounded bg-emerald-600 px-3 py-2 text-sm font-semibold">Add Menu</button>
        </form>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left">
              <th className="px-2 py-2">Key</th>
              <th className="px-2 py-2">Title</th>
              <th className="px-2 py-2">Path</th>
              <th className="px-2 py-2">Active</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-800">
                <td className="px-2 py-2">{item.key}</td>
                <td className="px-2 py-2">{item.title}</td>
                <td className="px-2 py-2">{item.path}</td>
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
