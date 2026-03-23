"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type PropertyItem = {
  id: number;
  publicId: string;
  title: string;
  city: string;
  price: string | number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  listingType: "BUY" | "RENT";
  isFeatured: boolean;
  createdAt: string;
  type?: {
    name?: string;
    slug?: string;
  };
  agent?: {
    id: number;
    name?: string | null;
    email?: string;
  };
};

function formatPrice(value: string | number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? "-");

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(n);
}

export default function AdminPropertiesPage() {
  const [items, setItems] = useState<PropertyItem[]>([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [listingType, setListingType] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [featureUpdatingId, setFeatureUpdatingId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (search.trim()) params.set("search", search.trim());
    if (city.trim()) params.set("city", city.trim());
    if (status) params.set("status", status);
    if (listingType) params.set("listingType", listingType);

    const response = await fetch(`/api/admin/properties?${params.toString()}`, {
      credentials: "include",
    });

    const data = await response.json().catch(() => null);

    if (response.ok) {
      setItems(data?.items ?? []);
      setTotal(data?.total ?? 0);
    } else {
      setItems([]);
      setTotal(0);
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, reloadKey]);

  const onFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setReloadKey((prev) => prev + 1);
  };

  const onResetFilters = () => {
    setSearch("");
    setCity("");
    setStatus("");
    setListingType("");
    setPage(1);
    setReloadKey((prev) => prev + 1);
  };

  const onRefreshFilters = () => {
    setPage(1);
    setReloadKey((prev) => prev + 1);
  };

  const onToggleFeatured = async (item: PropertyItem) => {
    if (featureUpdatingId !== null) return;

    setFeatureUpdatingId(item.id);
    const res = await fetch(`/api/properties/${item.publicId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !item.isFeatured }),
    });

    if (!res.ok) {
      alert("Unable to update featured status.");
      setFeatureUpdatingId(null);
      return;
    }

    await loadData();
    setFeatureUpdatingId(null);
  };

  const onDeleteListing = async (item: PropertyItem) => {
    if (!confirm(`Delete "${item.title}"? It will be archived.`)) return;

    const res = await fetch(`/api/properties/${item.publicId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      alert("Unable to delete listing.");
      return;
    }

    await loadData();
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section>
      <h1 className="text-xl font-bold">Properties</h1>
      <p className="mt-1 text-xs text-slate-300">Admin property listing with filters and pagination.</p>

      <form onSubmit={onFilter} className="mt-4 rounded-xl border border-white/10 bg-slate-900/40 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Search & Filters</p>
        <div className="grid gap-2 md:grid-cols-[minmax(220px,2fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)_auto_auto]">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Search</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, city, address"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Listing Type</label>
            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="">All listing types</option>
              <option value="BUY">BUY</option>
              <option value="RENT">RENT</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            >
              <option value="">All status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
          <button type="submit" className="h-10 self-end rounded bg-blue-600 px-3 text-sm font-semibold">
            Apply
          </button>
          <div className="flex items-end gap-2">
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
        </div>
      </form>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left">
              <th className="px-2 py-2">Title</th>
              <th className="px-2 py-2">City</th>
              <th className="px-2 py-2">Type</th>
              <th className="px-2 py-2">Listing</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Featured</th>
              <th className="px-2 py-2">Price</th>
              <th className="px-2 py-2">Agent</th>
              <th className="px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-800">
                <td className="px-2 py-2">{item.title}</td>
                <td className="px-2 py-2">{item.city}</td>
                <td className="px-2 py-2">{item.type?.name ?? "-"}</td>
                <td className="px-2 py-2">{item.listingType}</td>
                <td className="px-2 py-2">{item.status}</td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <span>{item.isFeatured ? "Yes" : "No"}</span>
                    <button
                      type="button"
                      disabled={featureUpdatingId === item.id}
                      onClick={() => void onToggleFeatured(item)}
                      className={`rounded px-2 py-1 text-xs font-semibold disabled:opacity-50 ${
                        item.isFeatured
                          ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                          : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                      }`}
                    >
                      {featureUpdatingId === item.id ? "Updating..." : item.isFeatured ? "Unfeature" : "Feature"}
                    </button>
                  </div>
                </td>
                <td className="px-2 py-2">₹ {formatPrice(item.price)}</td>
                <td className="px-2 py-2">{item.agent?.name ?? item.agent?.email ?? "-"}</td>
                <td className="px-2 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/properties/${item.publicId}`}
                      className="animated-btn rounded bg-slate-700 px-2 py-1 text-xs font-semibold text-slate-100"
                    >
                      View
                    </Link>
                    <Link
                      href={`/agent/properties/${item.publicId}/edit`}
                      className="animated-btn rounded bg-indigo-500/25 px-2 py-1 text-xs font-semibold text-indigo-200"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => void onDeleteListing(item)}
                      className="rounded bg-rose-500/25 px-2 py-1 text-xs font-semibold text-rose-200"
                    >
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
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded bg-slate-700 px-3 py-1 disabled:opacity-40"
        >
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
