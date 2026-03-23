import type { ReactNode } from "react";

import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.20),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.20),_transparent_35%)]" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="text-2xl font-bold tracking-wide text-cyan-300">
              REAL ESTATE SERVICE
            </Link>
            <p className="mt-1 text-sm text-slate-400">Your modern property platform</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
