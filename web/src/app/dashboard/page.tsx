"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Navbar from "@/components/Navbar";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function BuyerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setUser(data?.user ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/");
    router.refresh();
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
          <div className="mb-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-6 py-5">
            <p className="text-sm font-medium text-cyan-300">Welcome back 👋</p>
            <h1 className="mt-1 text-2xl font-bold">{user?.name ?? "Buyer"}</h1>
            <p className="mt-1 text-sm text-slate-400">{user?.email}</p>
          </div>

          {/* Quick stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs text-slate-400">Saved Searches</p>
              <p className="mt-2 text-3xl font-bold text-white">—</p>
              <p className="mt-1 text-xs text-slate-500">Coming soon</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs text-slate-400">Favourite Properties</p>
              <p className="mt-2 text-3xl font-bold text-white">—</p>
              <p className="mt-1 text-xs text-slate-500">Coming soon</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs text-slate-400">Inquiries Sent</p>
              <p className="mt-2 text-3xl font-bold text-white">—</p>
              <p className="mt-1 text-xs text-slate-500">Coming soon</p>
            </div>
          </div>

          {/* Quick actions */}
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Link
              href="/properties"
              className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-cyan-400/40 hover:bg-white/8"
            >
              <span className="text-3xl">🏠</span>
              <span className="font-semibold">Browse Properties</span>
              <span className="text-xs text-slate-400">
                Search buy &amp; rent listings across all cities
              </span>
            </Link>

            <Link
              href="/properties?listingType=BUY"
              className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-green-400/40 hover:bg-white/8"
            >
              <span className="text-3xl">🔑</span>
              <span className="font-semibold">Properties for Sale</span>
              <span className="text-xs text-slate-400">
                Find your dream home to own
              </span>
            </Link>

            <Link
              href="/properties?listingType=RENT"
              className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-indigo-400/40 hover:bg-white/8"
            >
              <span className="text-3xl">🏙️</span>
              <span className="font-semibold">Properties for Rent</span>
              <span className="text-xs text-slate-400">
                Find apartments, flats and houses to rent
              </span>
            </Link>
          </div>

          {/* Account section */}
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-1 font-semibold">Account</h2>
            <p className="mb-4 text-sm text-slate-400">
              Manage your account settings and preferences.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                disabled
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Edit Profile (coming soon)
              </button>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:border-red-400/50 hover:bg-red-500/20"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
