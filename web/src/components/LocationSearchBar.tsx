"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type City = { name: string; count: number };

export default function LocationSearchBar() {
  const [cities, setCities] = useState<City[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/properties/cities")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.cities) setCities(d.cities as City[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search.trim()
    ? cities.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : cities;

  const handleSelect = (cityName: string) => {
    localStorage.setItem("selectedCity", cityName);
    setOpen(false);
    setSearch("");
    router.push(`/properties?city=${encodeURIComponent(cityName)}`);
  };

  const handleAllCities = () => {
    localStorage.removeItem("selectedCity");
    setOpen(false);
    router.push("/properties");
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
      <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-300/80">
        Find your home
      </p>
      <h3 className="mb-5 text-xl font-bold text-white">
        Select your city to
        <span className="bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
          {" "}browse listings
        </span>
      </h3>

      {/* Search input + dropdown */}
      <div ref={wrapperRef} className="relative">
        <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-slate-900 px-4 py-3 transition focus-within:border-cyan-400/60">
          <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search for a city..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setOpen(false);
              }}
              className="text-slate-500 transition hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            {/* All cities row */}
            <button
              onClick={handleAllCities}
              className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5"
            >
              <span className="text-base">🌐</span>
              <div>
                <p className="text-sm font-semibold text-slate-200">All Cities</p>
                <p className="text-xs text-slate-500">Show properties from every location</p>
              </div>
            </button>

            {loading ? (
              <div className="space-y-1 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-9 animate-pulse rounded-lg bg-white/5" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-4 py-4 text-sm text-slate-500">No cities found</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.name}
                  onClick={() => handleSelect(c.name)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left transition hover:bg-cyan-400/10"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">📍</span>
                    <span className="text-sm font-medium text-white">{c.name}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {c.count} {c.count === 1 ? "listing" : "listings"}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Popular city chips */}
      {!open && cities.length > 0 && (
        <div className="mt-5">
          <p className="mb-2.5 text-xs font-medium text-slate-500">Popular cities</p>
          <div className="flex flex-wrap gap-2">
            {cities.slice(0, 8).map((c) => (
              <button
                key={c.name}
                onClick={() => handleSelect(c.name)}
                className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-300"
              >
                📍 {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton for chips */}
      {!open && loading && (
        <div className="mt-5 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-white/5" />
          ))}
        </div>
      )}

      <div className="mt-5 border-t border-white/10 pt-4">
        <button
          onClick={handleAllCities}
          className="text-xs text-slate-500 transition hover:text-cyan-300"
        >
          Browse all listings without filter →
        </button>
      </div>
    </div>
  );
}
