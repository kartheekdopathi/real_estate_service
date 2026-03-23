"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type Role = { id: string; roleName: string };

const roleDashboard: Record<string, string> = {
  AGENT: "/agent",
  BUYER: "/dashboard",
};

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"BUYER" | "AGENT">("BUYER");
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load available roles from master table
  useEffect(() => {
    fetch("/api/roles")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.roles) {
          // Only show BUYER and AGENT (not ADMIN) for self-registration
          const filtered: Role[] = (data.roles as Role[]).filter(
            (r) => r.roleName === "BUYER" || r.roleName === "AGENT",
          );
          setRoles(filtered);
        }
      })
      .catch(() => {
        // fallback: keep default state
      });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, phone: phone || undefined, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      const userRole: string = data.user?.role ?? "BUYER";
      router.push(roleDashboard[userRole] ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
      <h1 className="mb-1 text-2xl font-bold">Create account</h1>
      <p className="mb-6 text-sm text-slate-400">Join as a buyer or agent today</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300" htmlFor="phone">
            Phone{" "}
            <span className="text-slate-500">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 234 567 8900"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-300">
            I am registering as
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(
              roles.length > 0
                ? roles
                : [
                    { id: "b", roleName: "BUYER" },
                    { id: "a", roleName: "AGENT" },
                  ]
            ).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.roleName as "BUYER" | "AGENT")}
                className={`rounded-xl border py-3 text-sm font-semibold transition ${
                  role === r.roleName
                    ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                    : "border-white/10 bg-slate-900 text-slate-300 hover:border-white/30"
                }`}
              >
                {r.roleName === "BUYER" ? "🏠 Buyer" : "🏢 Agent"}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {role === "AGENT"
              ? "Agents can list and manage properties."
              : "Buyers can browse, save, and inquire about properties."}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-cyan-400 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-cyan-400 hover:text-cyan-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
