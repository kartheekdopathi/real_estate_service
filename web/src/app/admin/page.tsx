import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <section>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="mt-2 text-sm text-slate-300">
        Manage users, roles, menus, property types, and permission access from the left menu.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/permission-settings?mode=role"
          className="rounded border border-slate-700 bg-slate-800 p-4 transition hover:border-cyan-400/60 hover:bg-slate-800/80"
        >
          <h2 className="text-sm font-semibold">Role Based Access</h2>
          <p className="mt-2 text-xs text-slate-300">Configure VIEW / CREATE / EDIT / DELETE for each role.</p>
        </Link>
        <Link
          href="/admin/permission-settings?mode=user"
          className="rounded border border-slate-700 bg-slate-800 p-4 transition hover:border-cyan-400/60 hover:bg-slate-800/80"
        >
          <h2 className="text-sm font-semibold">User Overrides</h2>
          <p className="mt-2 text-xs text-slate-300">Override permissions per user (example: view+edit but no delete).</p>
        </Link>
        <Link
          href="/admin/menu-settings?mode=role"
          className="rounded border border-slate-700 bg-slate-800 p-4 transition hover:border-cyan-400/60 hover:bg-slate-800/80"
        >
          <h2 className="text-sm font-semibold">Dynamic Menus</h2>
          <p className="mt-2 text-xs text-slate-300">Control menu visibility by role and by user.</p>
        </Link>
      </div>
    </section>
  );
}
