"use client";

import { useCallback, useEffect, useState } from "react";

type Enquiry = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  status: "new" | "read" | "resolved";
  createdAt: string;
};

type ListResponse = {
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  items: Enquiry[];
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  read: { label: "Read", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  resolved: { label: "Resolved", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
};

export default function AdminEnquiriesPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "read" | "resolved">("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: String(page),
        limit: "20",
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/admin/enquiries?${params.toString()}`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const updateEnquiry = async (id: number, updates: { isRead?: boolean; status?: "new" | "read" | "resolved" }) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await load();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const deleteEnquiry = async (id: number) => {
    if (!window.confirm("Archive this enquiry?")) return;
    setActionLoading(id);
    try {
      await fetch(`/api/admin/enquiries/${id}`, { method: "DELETE", credentials: "include" });
      await load();
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <section>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Contact Enquiries</h1>
          {data && data.unreadCount > 0 && (
            <span className="rounded-full bg-cyan-500 px-2.5 py-0.5 text-xs font-bold text-slate-950 animate-pulse">
              {data.unreadCount} new
            </span>
          )}
        </div>
        <button
          onClick={() => void load()}
          className="animated-btn rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-500/60 hover:text-white"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-end gap-3">
        {/* Status filter tabs */}
        <div className="flex gap-1.5 rounded-lg border border-slate-700 bg-slate-800 p-1">
          {(["all", "new", "read", "resolved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === s
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search name, email, subject…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none w-56"
          />
          <button
            type="submit"
            className="animated-btn rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-600"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </form>
      </div>

      {/* Summary line */}
      {data && (
        <p className="mb-4 text-xs text-slate-500">
          Showing {data.items.length} of {data.total} enquiries
          {data.unreadCount > 0 && (
            <> &middot; <span className="text-cyan-400 font-medium">{data.unreadCount} unread</span></>
          )}
        </p>
      )}

      {/* Table / cards */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-800" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-slate-500">
          <span className="text-4xl">📭</span>
          <p className="text-sm">No enquiries found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.items.map((enq) => (
            <div
              key={enq.id}
              className={`rounded-xl border transition ${
                !enq.isRead
                  ? "border-cyan-500/30 bg-cyan-500/5"
                  : "border-slate-800 bg-slate-800/50"
              }`}
            >
              {/* Row summary */}
              <div
                className="flex cursor-pointer flex-wrap items-start gap-3 px-4 py-3"
                onClick={() => {
                  setExpanded(expanded === enq.id ? null : enq.id);
                  if (!enq.isRead) void updateEnquiry(enq.id, { isRead: true, status: "read" });
                }}
              >
                {/* Unread dot */}
                <div className="mt-1.5 shrink-0">
                  {!enq.isRead ? (
                    <span className="block h-2 w-2 rounded-full bg-cyan-400" title="Unread" />
                  ) : (
                    <span className="block h-2 w-2 rounded-full bg-slate-700" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-100">{enq.name}</span>
                    <span className="text-xs text-slate-500">{enq.email}</span>
                    {enq.phone && (
                      <span className="text-xs text-slate-500">&middot; {enq.phone}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-300">{enq.subject}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{enq.message}</p>
                </div>

                {/* Status + date */}
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_LABELS[enq.status]?.color ?? ""}`}
                  >
                    {STATUS_LABELS[enq.status]?.label ?? enq.status}
                  </span>
                  <span className="text-xs text-slate-600">
                    {new Date(enq.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Expand arrow */}
                <div className="shrink-0 text-slate-500 text-sm">{expanded === enq.id ? "▲" : "▼"}</div>
              </div>

              {/* Expanded detail */}
              {expanded === enq.id && (
                <div className="border-t border-slate-700/60 px-4 py-4">
                  <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{enq.message}</p>

                  <div className="flex flex-wrap gap-2">
                    {enq.status !== "resolved" && (
                      <button
                        disabled={actionLoading === enq.id}
                        onClick={() => void updateEnquiry(enq.id, { status: "resolved", isRead: true })}
                        className="animated-btn rounded-lg bg-emerald-500/20 px-4 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/30 disabled:opacity-50"
                      >
                        ✓ Mark Resolved
                      </button>
                    )}
                    {enq.isRead && enq.status !== "new" && (
                      <button
                        disabled={actionLoading === enq.id}
                        onClick={() => void updateEnquiry(enq.id, { status: "new", isRead: false })}
                        className="animated-btn rounded-lg bg-slate-700 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-600 disabled:opacity-50"
                      >
                        ↺ Reopen
                      </button>
                    )}
                    <a
                      href={`mailto:${enq.email}?subject=Re: ${encodeURIComponent(enq.subject)}`}
                      className="animated-btn rounded-lg bg-indigo-500/20 px-4 py-2 text-xs font-medium text-indigo-300 transition hover:bg-indigo-500/30"
                    >
                      ✉ Reply by Email
                    </a>
                    {enq.phone && (
                      <a
                        href={`tel:${enq.phone.replace(/\s/g, "")}`}
                        className="animated-btn rounded-lg bg-cyan-500/20 px-4 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/30"
                      >
                        📞 Call {enq.phone}
                      </a>
                    )}
                    <button
                      disabled={actionLoading === enq.id}
                      onClick={() => void deleteEnquiry(enq.id)}
                      className="animated-btn rounded-lg bg-rose-500/20 px-4 py-2 text-xs font-medium text-rose-400 transition hover:bg-rose-500/30 disabled:opacity-50"
                    >
                      🗑 Archive
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-slate-500">
            Page {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}
