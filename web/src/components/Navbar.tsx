"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  leadCredits?: number;
  subscriptionPlan?: "FREE" | "PRO" | "PREMIUM";
} | null;

const roleDashboard: Record<string, string> = {
  ADMIN: "/admin",
  AGENT: "/agent",
  BUYER: "/dashboard",
};

export default function Navbar() {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;


    fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted) return;
        setUser(data?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const dashboardLink = user ? (roleDashboard[user.role] ?? "/dashboard") : null;

  return (
    <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
      <Link href="/" className="menu-link rounded-md px-2 py-1 text-sm font-semibold tracking-wide text-cyan-300">
        REAL ESTATE SERVICE
      </Link>

      <nav className="hidden gap-5 text-sm text-slate-300 md:flex">
        <Link href="/properties" className="menu-link rounded-md px-2 py-1 transition hover:text-white">
          All Listings
        </Link>
        <Link href="/properties?featured=true" className="menu-link rounded-md px-2 py-1 transition hover:text-white">
          Featured
        </Link>
        <Link href="/properties?listingType=BUY" className="menu-link rounded-md px-2 py-1 transition hover:text-white">
          Buy
        </Link>
        <Link href="/properties?listingType=RENT" className="menu-link rounded-md px-2 py-1 transition hover:text-white">
          Rent
        </Link>
        <Link href="/contact" className="menu-link rounded-md px-2 py-1 transition hover:text-white">
          Contact Us
        </Link>
      </nav>

      <div className="flex items-center gap-2">
        {loading ? (
          <div className="h-7 w-24 animate-pulse rounded-lg bg-white/10" />
        ) : user ? (
          <>
            <span className="hidden text-xs text-slate-400 md:block">
              {user.name} &middot;{" "}
              <span className="font-semibold text-cyan-400">{user.role}</span>
            </span>
            <Link
              href={dashboardLink!}
              className="animated-btn rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-red-400/50 hover:text-red-400"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="animated-btn rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:text-white"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="animated-btn rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
