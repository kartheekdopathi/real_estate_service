"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";

import Navbar from "@/components/Navbar";

type MenuItem = {
  id: string;
  key: string;
  title: string;
  path: string;
  sortOrder: number;
};

type EnquiryNotification = {
  id: number;
  name: string;
  subject: string;
  createdAt: string;
};

const fallbackMenus: MenuItem[] = [
  { id: "1", key: "dashboard", title: "Dashboard", path: "/admin", sortOrder: 1 },
  { id: "2", key: "users", title: "Users", path: "/admin/users", sortOrder: 2 },
  { id: "3", key: "roles", title: "Roles", path: "/admin/roles", sortOrder: 3 },
  { id: "4", key: "property-types", title: "Property Types", path: "/admin/property-types", sortOrder: 4 },
  { id: "5", key: "menus", title: "Menus", path: "/admin/menus", sortOrder: 5 },
  { id: "6", key: "permissions", title: "Permissions", path: "/admin/permissions", sortOrder: 6 },
  { id: "7", key: "menu-settings", title: "Menu Settings", path: "/admin/menu-settings", sortOrder: 7 },
  {
    id: "8",
    key: "permission-settings",
    title: "Permission Settings",
    path: "/admin/permission-settings",
    sortOrder: 8,
  },
  { id: "9", key: "enquiries", title: "Enquiries", path: "/admin/enquiries", sortOrder: 9 },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menus, setMenus] = useState<MenuItem[]>(fallbackMenus);
  const [error, setError] = useState<string>("");
  const [unreadEnquiries, setUnreadEnquiries] = useState(0);
  const [notifications, setNotifications] = useState<EnquiryNotification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadMenus = async () => {
      try {
        setNotificationLoading(true);
        const [menuResponse, enquiriesResponse] = await Promise.all([
          fetch("/api/admin/access/menus", { credentials: "include" }),
          fetch("/api/admin/enquiries?status=new&limit=6", { credentials: "include" }),
        ]);

        const menuData = await menuResponse.json();

        if (!mounted) return;

        if (!menuResponse.ok) {
          setError(menuData?.error ?? "Unable to load menu access");
        } else {
          setMenus(menuData.menus ?? fallbackMenus);
        }

        if (enquiriesResponse.ok) {
          const eqData = await enquiriesResponse.json();
          if (!mounted) return;
          setUnreadEnquiries(eqData.unreadCount ?? 0);
          setNotifications(eqData.items ?? []);
        }
      } catch {
        if (!mounted) return;
        setError("Unable to load menu access");
      } finally {
        if (!mounted) return;
        setNotificationLoading(false);
      }
    };

    void loadMenus();

    const interval = setInterval(() => {
      void loadMenus();
    }, 20000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/enquiries/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true, status: "read" }),
      });

      if (!response.ok) {
        return;
      }

      setNotifications((prev) => prev.filter((item) => item.id !== id));
      setUnreadEnquiries((prev) => Math.max(0, prev - 1));
    } catch {
      // no-op
    }
  };

  const sortedMenus = useMemo(() => [...menus].sort((a, b) => a.sortOrder - b.sortOrder), [menus]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl p-4">
        <Navbar />

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr]">
          <aside className="relative rounded-lg border border-slate-800 bg-slate-900 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Control Center</p>
              </div>
              <div className="relative h-11 w-11">
                <button
                  onClick={() => setIsNotificationOpen((prev) => !prev)}
                  className={`group relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                    isNotificationOpen
                      ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-300 shadow-lg shadow-cyan-950/40"
                      : "border-slate-700/80 bg-slate-800/90 text-slate-300 hover:border-cyan-500/60 hover:bg-slate-800 hover:text-cyan-300"
                  }`}
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <span className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_60%)] opacity-0 transition group-hover:opacity-100" />
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="relative h-5 w-5"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17H9.143m9.524 0H19a1 1 0 0 0 .8-1.6l-1.514-2.019A5 5 0 0 1 17.286 10V9a5.286 5.286 0 1 0-10.572 0v1a5 5 0 0 1-1 3.381L4.2 15.4A1 1 0 0 0 5 17h14m-4.143 0a2.857 2.857 0 1 1-5.714 0" />
                  </svg>
                </button>

                {unreadEnquiries > 0 && (
                  <>
                    <span className="pointer-events-none absolute -right-1 -top-1 z-20 h-4 w-4 rounded-full bg-cyan-400/35 animate-ping" />
                    <span className="pointer-events-none absolute -right-2 -top-2 z-30 flex min-w-[22px] items-center justify-center rounded-full border-2 border-slate-900 bg-cyan-400 px-1.5 py-0.5 text-center text-[10px] font-extrabold leading-none text-slate-950 shadow-lg shadow-cyan-950/50">
                      {unreadEnquiries > 99 ? "99+" : unreadEnquiries}
                    </span>
                  </>
                )}

                {isNotificationOpen && (
                  <div className="absolute right-0 z-30 mt-3 w-[22rem] overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl">
                    <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">Notifications</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {unreadEnquiries > 0 ? `${unreadEnquiries} new contact enquiries` : "No unread contact enquiries"}
                          </p>
                        </div>
                        {unreadEnquiries > 0 ? (
                          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-300">
                            New
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="p-3">
                      <div className="mb-2 flex items-center justify-between">
                      <Link
                        href="/admin/enquiries"
                        className="text-xs font-medium text-cyan-400 transition hover:text-cyan-300"
                        onClick={() => setIsNotificationOpen(false)}
                      >
                        View all
                      </Link>
                        <span className="text-[11px] text-slate-500">Auto refresh: 20s</span>
                      </div>

                      {notificationLoading ? (
                        <div className="space-y-2 py-2">
                          <div className="h-16 animate-pulse rounded-2xl bg-slate-800/90" />
                          <div className="h-16 animate-pulse rounded-2xl bg-slate-800/90" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center rounded-2xl border border-slate-800 bg-slate-800/50 px-4 py-8 text-center">
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17H9.143m9.524 0H19a1 1 0 0 0 .8-1.6l-1.514-2.019A5 5 0 0 1 17.286 10V9a5.286 5.286 0 1 0-10.572 0v1a5 5 0 0 1-1 3.381L4.2 15.4A1 1 0 0 0 5 17h14m-4.143 0a2.857 2.857 0 1 1-5.714 0" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-slate-200">No new notifications</p>
                          <p className="mt-1 text-xs text-slate-500">New contact enquiries will appear here.</p>
                        </div>
                      ) : (
                        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                          {notifications.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-800/90 to-slate-800/60 p-3 transition hover:border-cyan-500/30 hover:from-slate-800 hover:to-cyan-950/20"
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/20">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25 10.2 13.5a3 3 0 0 0 3.6 0L21 8.25M4.5 19.5h15a1.5 1.5 0 0 0 1.5-1.5v-12A1.5 1.5 0 0 0 19.5 4.5h-15A1.5 1.5 0 0 0 3 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
                                  </svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-slate-100">{item.name}</p>
                                      <p className="mt-0.5 line-clamp-1 text-xs text-cyan-300">{item.subject}</p>
                                    </div>
                                    <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
                                      New
                                    </span>
                                  </div>
                                  <div className="mt-2 flex items-center justify-between gap-3">
                                    <span className="text-[11px] text-slate-500">
                                      {new Date(item.createdAt).toLocaleString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    <button
                                      onClick={() => void markAsRead(item.id)}
                                      className="rounded-xl border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300"
                                    >
                                      Mark read
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <nav className="space-y-2">
              {sortedMenus.map((menu) => {
                const active = menu.path === "/admin" ? pathname === menu.path : pathname.startsWith(menu.path);
                const isEnquiries = menu.key === "enquiries";

                return (
                  <Link
                    key={menu.id}
                    href={menu.path}
                    className={`menu-link flex items-center justify-between rounded px-3 py-2 text-sm ${
                      active ? "menu-link-active bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span>{menu.title}</span>
                    {isEnquiries && unreadEnquiries > 0 && (
                      <span className="ml-2 min-w-[20px] rounded-full bg-cyan-500 px-1.5 py-0.5 text-center text-xs font-bold text-slate-950">
                        {unreadEnquiries > 99 ? "99+" : unreadEnquiries}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            {error ? <p className="mt-4 text-xs text-amber-400">{error}</p> : null}
          </aside>

          <main className="rounded-lg border border-slate-800 bg-slate-900 p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
