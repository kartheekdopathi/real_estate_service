"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type City = { name: string; count: number };

type Props = {
  onClose: () => void;
};

export default function CityPickerModal({ onClose }: Props) {
  const [cities, setCities] = useState<City[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Mount portal + lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    setTimeout(() => inputRef.current?.focus(), 80);
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    fetch("/api/properties/cities")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.cities) setCities(d.cities as City[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = cities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase().trim()),
  );

  const handleSelect = (cityName: string) => {
    localStorage.setItem("selectedCity", cityName);
    onClose();
    router.push(`/properties?city=${encodeURIComponent(cityName)}`);
  };

  const handleAll = () => {
    localStorage.removeItem("selectedCity");
    onClose();
    router.push("/properties");
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/70 px-4 pt-14 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/15 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">Choose your city</h2>
            <p className="text-xs text-slate-500">Properties will be filtered for the selected city</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:border-white/30 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 transition focus-within:border-cyan-400/60">
            <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search city..."
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-slate-500 transition hover:text-white">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* All cities option */}
        <div className="px-6 pt-3">
          <button
            onClick={handleAll}
            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-cyan-400/40 hover:bg-cyan-400/5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-400/10 text-lg">🌐</div>
            <div>
              <p className="text-sm font-semibold text-white">All Cities</p>
              <p className="text-xs text-slate-500">Browse properties from every location</p>
            </div>
          </button>
        </div>

        {/* City grid */}
        <div className="max-h-64 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No cities match your search</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {filtered.map((c) => (
                <button
                  key={c.name}
                  onClick={() => handleSelect(c.name)}
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:border-cyan-400/50 hover:bg-cyan-400/5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-sm">
                    📍
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-slate-500">
                      {c.count} {c.count === 1 ? "listing" : "listings"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
