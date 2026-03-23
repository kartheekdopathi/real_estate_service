"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Navbar from "@/components/Navbar";

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  leadCredits?: number;
  subscriptionPlan?: "FREE" | "PRO" | "PREMIUM";
};

type PropertyItem = {
  id: number;
  publicId?: string;
  title: string;
  price: string;
  city: string;
  listingType: "BUY" | "RENT";
  status: string;
  isFeatured?: boolean;
  _count?: { contactReveals: number };
  type: { name: string };
};

export default function AgentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [listings, setListings] = useState<PropertyItem[]>([]);
  const [listingCount, setListingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // Fetch current user
      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData = await meRes.json();
      if (!mounted) return;
      setUser(meData.user);

      // Fetch this agent's own properties (all statuses)
      const propRes = await fetch("/api/properties?mine=true&limit=6", { credentials: "include" });
      if (propRes.ok) {
        const propData = await propRes.json();
        if (!mounted) return;
        setListings(propData.items ?? []);
        setListingCount(propData.total ?? 0);
      }

      setLoading(false);
    };

    init().catch(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/");
    router.refresh();
  };

  const reloadListings = async () => {
    const propRes = await fetch("/api/properties?mine=true&limit=6", { credentials: "include" });
    if (!propRes.ok) return;
    const propData = await propRes.json();
    setListings(propData.items ?? []);
    setListingCount(propData.total ?? 0);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this listing? It will be archived and hidden.")) return;
    const found = listings.find((p) => p.id === id);
    const routeId = found?.publicId ?? String(id);
    const res = await fetch(`/api/properties/${routeId}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      alert("Failed to delete listing.");
      return;
    }
    await reloadListings();
  };

  const handleFeature = async (id: number, nextValue: boolean) => {
    const found = listings.find((p) => p.id === id);
    const routeId = found?.publicId ?? String(id);
    const res = await fetch(`/api/properties/${routeId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: nextValue }),
    });

    if (res.status === 402) {
      alert("Upgrade plan to PRO/PREMIUM before featuring listings.");
      return;
    }

    if (!res.ok) {
      alert("Failed to update featured status.");
      return;
    }
    await reloadListings();
  };

  const handleDemoUpgrade = async (pkg: "PRO_MONTHLY" | "PREMIUM_MONTHLY" | "LEAD_PACK_10") => {
    const res = await fetch("/api/agent/monetization/checkout-demo", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ package: pkg }),
    });

    if (!res.ok) {
      alert("Failed to activate package.");
      return;
    }

    const meRes = await fetch("/api/auth/me", { credentials: "include" });
    if (meRes.ok) {
      const meData = await meRes.json();
      setUser(meData.user);
    }

    alert("Package activated (demo mode).");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-cyan-400" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.14),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.14),_transparent_35%)]" />

      <main className="relative mx-auto max-w-6xl px-6 py-8 md:px-10">
        <Navbar />

        <div className="mt-10">
          {/* Welcome banner */}
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-indigo-400/20 bg-indigo-400/5 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-300">Agent Dashboard 🏢</p>
              <h1 className="mt-1 text-2xl font-bold">{user?.name ?? "Agent"}</h1>
              <p className="mt-1 text-sm text-slate-400">{user?.email}</p>
            </div>
            <Link
              href="/agent/post-property"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              <span>＋</span> Post New Property
            </Link>
          </div>

          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs text-slate-400">Total Listings</p>
              <p className="mt-2 text-3xl font-bold text-white">{listingCount}</p>
              <p className="mt-1 text-xs text-slate-500">Published properties</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs text-slate-400">Inquiries Received</p>
              <p className="mt-2 text-3xl font-bold text-white">—</p>
              <p className="mt-1 text-xs text-slate-500">Coming soon</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs text-slate-400">Profile Views</p>
              <p className="mt-2 text-3xl font-bold text-white">—</p>
              <p className="mt-1 text-xs text-slate-500">Coming soon</p>
            </div>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs text-slate-400">Current Plan</p>
              <p className="mt-2 text-xl font-bold text-white">{user?.subscriptionPlan ?? "FREE"}</p>
              <p className="mt-1 text-xs text-slate-500">Phase 1 monetization</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs text-slate-400">Lead Credits</p>
              <p className="mt-2 text-xl font-bold text-cyan-300">{user?.leadCredits ?? 0}</p>
              <p className="mt-1 text-xs text-slate-500">Used for contact reveals</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="mb-2 text-xs text-slate-400">Demo Packages</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleDemoUpgrade("PRO_MONTHLY")} className="rounded bg-indigo-500/20 px-2 py-1 text-xs text-indigo-300">PRO</button>
                <button onClick={() => handleDemoUpgrade("PREMIUM_MONTHLY")} className="rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-300">PREMIUM</button>
                <button onClick={() => handleDemoUpgrade("LEAD_PACK_10")} className="rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300">+10 Credits</button>
              </div>
            </div>
          </div>

          {/* Recent listings */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Listings</h2>
              <Link
                href="/properties"
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                View all →
              </Link>
            </div>

            {listings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center">
                <p className="mb-2 text-slate-400">No listings yet</p>
                <Link
                  href="/agent/post-property"
                  className="text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Post your first property
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/10 bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">City</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Listing</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Leads</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {listings.map((prop) => (
                      <tr key={prop.id} className="transition hover:bg-white/5">
                        <td className="px-4 py-3 font-medium">{prop.title}</td>
                        <td className="px-4 py-3 text-slate-400">{prop.type.name}</td>
                        <td className="px-4 py-3 text-slate-400">{prop.city}</td>
                        <td className="px-4 py-3 text-cyan-300">
                          ${Number(prop.price).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              prop.listingType === "BUY"
                                ? "bg-green-400/10 text-green-400"
                                : "bg-indigo-400/10 text-indigo-400"
                            }`}
                          >
                            {prop.listingType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              prop.status === "PUBLISHED"
                                ? "bg-green-400/10 text-green-400"
                                : prop.status === "DRAFT"
                                  ? "bg-yellow-400/10 text-yellow-400"
                                  : "bg-slate-500/10 text-slate-500"
                            }`}
                          >
                            {prop.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{prop._count?.contactReveals ?? 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Link className="rounded bg-white/10 px-2 py-1 hover:bg-white/20" href={`/agent/properties/${prop.publicId ?? prop.id}`}>View</Link>
                            <Link className="rounded bg-indigo-500/20 px-2 py-1 text-indigo-300 hover:bg-indigo-500/30" href={`/agent/properties/${prop.publicId ?? prop.id}/edit`}>Edit</Link>
                            <button
                              onClick={() => handleFeature(prop.id, !prop.isFeatured)}
                              className="rounded bg-amber-500/20 px-2 py-1 text-amber-300 hover:bg-amber-500/30"
                            >
                              {prop.isFeatured ? "Unfeature" : "Feature"}
                            </button>
                            <button onClick={() => handleDelete(prop.id)} className="rounded bg-red-500/20 px-2 py-1 text-red-300 hover:bg-red-500/30">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Link
              href="/agent/post-property"
              className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-cyan-400/40 hover:bg-white/8"
            >
              <span className="text-3xl">📋</span>
              <span className="font-semibold">Post Property</span>
              <span className="text-xs text-slate-400">Add a new buy or rent listing</span>
            </Link>

            <Link
              href="/properties"
              className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-indigo-400/40 hover:bg-white/8"
            >
              <span className="text-3xl">🔍</span>
              <span className="font-semibold">Browse All Listings</span>
              <span className="text-xs text-slate-400">See all published properties</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex flex-col gap-2 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-left transition hover:border-red-400/40"
            >
              <span className="text-3xl">🚪</span>
              <span className="font-semibold text-red-400">Logout</span>
              <span className="text-xs text-slate-400">Sign out of your account</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
