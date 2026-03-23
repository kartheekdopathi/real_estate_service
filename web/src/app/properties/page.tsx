"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";

type PropertyItem = {
  id: number;
  publicId?: string;
  title: string;
  isFeatured?: boolean;
  price: string;
  beds: number;
  baths: number;
  areaSqft: number;
  city: string;
  address: string;
  listingType: "BUY" | "RENT";
  type: { name: string; slug: string };
  agent: { id: number; name: string } | null;
  images: { url: string }[];
  _count?: { contactReveals: number };
};

type PropertyType = { id: string; name: string; slug: string };
type SearchMode = "keyword" | "semantic";

type NearbyItem = {
  id: number;
  publicId?: string;
  title: string;
  isFeatured?: boolean;
  listingType: "BUY" | "RENT";
  city: string;
  address: string;
  price: string;
  beds: number;
  baths: number;
  areaSqft: number;
  type: { name: string; slug: string };
  latitude: number;
  longitude: number;
  distanceKm: number;
  thumbnail: string | null;
  agent: { id: number; name: string } | null;
};

type GeoState = "idle" | "loading" | "granted" | "denied" | "error";

function PropertiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qsQuery = searchParams.get("q") ?? "";
  const qsSearchMode = (searchParams.get("searchMode") ?? "keyword") as SearchMode;
  const qsFeatured = searchParams.get("featured") ?? "";
  const qsListingType = searchParams.get("listingType") ?? "";
  const qsCity = searchParams.get("city") ?? "";
  const qsType = searchParams.get("type") ?? "";

  const [items, setItems] = useState<PropertyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [cities, setCities] = useState<{ name: string; count: number }[]>([]);
  const [viewerRole, setViewerRole] = useState<string>("");
  // Nearby (GPS + searched location) state
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [nearbyItems, setNearbyItems] = useState<NearbyItem[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState(10);
  const [nearbyCoords, setNearbyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [nearbyError, setNearbyError] = useState("");

  const [viewerId, setViewerId] = useState<number | null>(null);
  const [remainingLeadCredits, setRemainingLeadCredits] = useState<number | null>(null);
  const [revealedContacts, setRevealedContacts] = useState<Record<number, { phone?: string | null; whatsapp?: string | null; email?: string | null }>>({});

  // Filters
  const [query, setQuery] = useState(qsQuery);
  const [searchMode, setSearchMode] = useState<SearchMode>(qsSearchMode === "semantic" ? "semantic" : "keyword");
  const [featured, setFeatured] = useState(qsFeatured === "true" ? "true" : "");
  const [listingType, setListingType] = useState(qsListingType);
  const [city, setCity] = useState(qsCity);
  const [typeSlug, setTypeSlug] = useState(qsType);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const normalizedQuery = query.trim();
  const hasValidSearchQuery = normalizedQuery.length >= 3;
  const isQueryTooShort = normalizedQuery.length > 0 && normalizedQuery.length < 3;

  const limit = 12;

  // Load property types for filter dropdown
  useEffect(() => {
    fetch("/api/property-types")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.types) setPropertyTypes(data.types);
      })
      .catch(() => {});
  }, []);

  // Load available cities for location filter
  useEffect(() => {
    fetch("/api/properties/cities")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.cities) setCities(data.cities as { name: string; count: number }[]);
      })
      .catch(() => {});
  }, []);

  // Keep local filter state synced with URL when navigating via navbar links
  useEffect(() => {
    setQuery(qsQuery);
    setSearchMode(qsSearchMode === "semantic" ? "semantic" : "keyword");
    setFeatured(qsFeatured === "true" ? "true" : "");
    setListingType(qsListingType);
    // If URL has city, use it and persist to localStorage
    if (qsCity) {
      setCity(qsCity);
      localStorage.setItem("selectedCity", qsCity);
    } else {
      setCity("");
    }
    setTypeSlug(qsType);
    setPage(1);
  }, [qsQuery, qsSearchMode, qsFeatured, qsListingType, qsCity, qsType]);

  // On first mount: if no ?city= in URL, restore from localStorage
  useEffect(() => {
    if (!qsCity) {
      const saved = localStorage.getItem("selectedCity");
      if (saved) {
        setCity(saved);
        setPage(1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user;
        if (!u) return;
        setViewerId(typeof u.id === "number" ? u.id : null);
        setViewerRole(u.role ?? "");
        setRemainingLeadCredits(typeof u.leadCredits === "number" ? u.leadCredits : null);
      })
      .catch(() => {});
  }, []);

  // Load properties
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (nearbyCoords) {
        if (mounted) {
          setLoading(true);
          setLoadingMore(false);
        }
        try {
          const data = await loadNearby(nearbyCoords, nearbyRadius);
          if (!mounted) return;
          const nextNearby = (data?.results ?? []) as NearbyItem[];
          setNearbyItems(nextNearby);
          const mapped: PropertyItem[] = nextNearby.map((item) => ({
            id: item.id,
            publicId: item.publicId,
            title: item.title,
            isFeatured: item.isFeatured,
            price: String(item.price),
            beds: item.beds,
            baths: item.baths,
            areaSqft: item.areaSqft,
            city: item.city,
            address: item.address,
            listingType: item.listingType,
            type: item.type,
            agent: item.agent,
            images: item.thumbnail ? [{ url: item.thumbnail }] : [],
          }));
          setItems(mapped);
          setTotal(data?.total ?? mapped.length);
        } finally {
          if (mounted) {
            setLoading(false);
            setLoadingMore(false);
          }
        }
        return;
      }

      if (mounted) {
        if (page === 1) {
          setLoading(true);
          setLoadingMore(false);
        } else {
          setLoadingMore(true);
        }
      }

      const params = new URLSearchParams();
      if (hasValidSearchQuery) {
        params.set("q", normalizedQuery);
        params.set("searchMode", searchMode);
      }
      if (featured) params.set("featured", featured);
      if (listingType) params.set("listingType", listingType);
      if (city.trim()) params.set("city", city.trim());
      if (typeSlug) params.set("type", typeSlug);
      params.set("page", String(page));
      params.set("limit", String(limit));

      try {
        const r = await fetch(`/api/properties?${params.toString()}`);
        const data = r.ok ? await r.json() : null;
        if (!mounted) return;
        const nextItems = (data?.items ?? []) as PropertyItem[];
        setItems((prev) => {
          if (page === 1) return nextItems;
          const seen = new Set(prev.map((p) => p.id));
          const merged = [...prev];
          for (const item of nextItems) {
            if (!seen.has(item.id)) {
              merged.push(item);
            }
          }
          return merged;
        });
        setTotal(data?.total ?? 0);
      } catch {
        // ignore
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [query, normalizedQuery, hasValidSearchQuery, searchMode, featured, listingType, city, typeSlug, page, reloadKey, nearbyCoords, nearbyRadius]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const hasMore = nearbyCoords ? false : items.length < total;
    if (!hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        setPage((prev) => prev + 1);
      },
      { rootMargin: "300px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [items.length, total, loading, loadingMore]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleResetFilters = () => {
    setQuery("");
    setSearchMode("keyword");
    setFeatured("");
    setListingType("");
    setCity("");
    setTypeSlug("");
    setPage(1);
    setReloadKey((prev) => prev + 1);
    localStorage.removeItem("selectedCity");
  };

  const handleUseMyLocation = () => {
    setNearbyError("");
    if (!navigator.geolocation) {
      setGeoState("denied");
      return;
    }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setNearbyCoords(coords);
        setGeoState("granted");
        setPage(1);
      },
      () => {
        setGeoState("denied");
      },
      { timeout: 10000 },
    );
  };

  const loadNearby = async (coords: { lat: number; lng: number }, radius: number) => {
    setNearbyLoading(true);
    try {
      const params = new URLSearchParams({
        lat: String(coords.lat),
        lng: String(coords.lng),
        radiusKm: String(radius),
        limit: "100",
      });
      if (hasValidSearchQuery) params.set("q", normalizedQuery);
      if (featured) params.set("featured", featured);
      if (listingType) params.set("listingType", listingType);
      if (city.trim()) params.set("city", city.trim());
      if (typeSlug) params.set("type", typeSlug);

      const r = await fetch(`/api/properties/nearby?${params.toString()}`);
      const data = r.ok ? await r.json() : null;
      setNearbyError("");
      return data;
    } catch {
      setNearbyError("Unable to fetch nearby properties.");
      return null;
    } finally {
      setNearbyLoading(false);
    }
  };

  const handleSearchByLocation = async () => {
    const q = locationQuery.trim();
    if (!q) {
      setNearbyError("Enter a location to search.");
      return;
    }

    setGeoState("loading");
    setNearbyError("");

    try {
      const params = new URLSearchParams({ q });
      const r = await fetch(`/api/geocode?${params.toString()}`);
      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.result) {
        setGeoState("error");
        setNearbyError(data?.error ?? "Location not found.");
        return;
      }

      const coords = { lat: Number(data.result.lat), lng: Number(data.result.lng) };
      setNearbyCoords(coords);
      setLocationLabel(String(data.result.formattedAddress ?? q));
      setGeoState("granted");
      setPage(1);
    } catch {
      setGeoState("error");
      setNearbyError("Unable to search this location right now.");
    }
  };

  const handleNearbyRadiusChange = (newRadius: number) => {
    setNearbyRadius(newRadius);
    setPage(1);
  };

  const handleClearNearby = () => {
    setNearbyItems([]);
    setNearbyCoords(null);
    setLocationLabel("");
    setLocationQuery("");
    setNearbyError("");
    setGeoState("idle");
    setPage(1);
  };

  const handleRefreshFilters = () => {
    setPage(1);
    setReloadKey((prev) => prev + 1);
  };

  const handleRevealContact = async (propertyId: number) => {
    const found = items.find((p) => p.id === propertyId);
    const routeId = found?.publicId ?? String(propertyId);
    const res = await fetch(`/api/properties/${routeId}/reveal-contact`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json().catch(() => null);

    if (res.status === 402) {
      alert(data?.error ?? "No lead credits remaining.");
      return;
    }

    if (!res.ok) {
      alert(data?.error ?? "Unable to reveal contact.");
      return;
    }

    setRevealedContacts((prev) => ({
      ...prev,
      [propertyId]: data.contact,
    }));

    if (typeof data.remainingLeadCredits === "number") {
      setRemainingLeadCredits(data.remainingLeadCredits);
    }
  };

  const canManageListing = (prop: PropertyItem) => {
    if (viewerRole === "ADMIN") return true;
    return viewerRole === "AGENT" && viewerId != null && prop.agent?.id === viewerId;
  };

  const handleDeleteListing = async (propertyId: number) => {
    if (!confirm("Delete this property listing? It will be archived.")) return;

    const found = items.find((p) => p.id === propertyId);
    const routeId = found?.publicId ?? String(propertyId);
    const res = await fetch(`/api/properties/${routeId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(data?.error ?? "Unable to delete listing.");
      return;
    }

    setItems((prev) => prev.filter((p) => p.id !== propertyId));
    setTotal((prev) => Math.max(0, prev - 1));
  };

  const openPropertyView = (prop: PropertyItem) => {
    const routeId = prop.publicId ?? String(prop.id);
    if (canManageListing(prop)) {
      router.push(`/agent/properties/${routeId}`);
      return;
    }
    router.push(`/properties/${routeId}`);
  };

  const nearbyDistanceById = new Map<number, number>();
  for (const item of nearbyItems) {
    nearbyDistanceById.set(item.id, item.distanceKm);
  }

  return (
    <>
      {/* Filters */}
      {/* ── Nearby / GPS search ── */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">📡 Nearby Properties</p>
            <p className="text-xs text-slate-500">Search a location (Google geocoding) and find properties within a radius</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSearchByLocation();
                }
              }}
              placeholder="Search city, area, landmark..."
              className="w-56 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
            />
            <button
              type="button"
              onClick={() => void handleSearchByLocation()}
              className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
            >
              Search location
            </button>

            {/* Radius selector — only when GPS active */}
            {geoState === "granted" && (
              <select
                value={nearbyRadius}
                onChange={(e) => handleNearbyRadiusChange(Number(e.target.value))}
                className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none transition focus:border-cyan-400"
              >
                <option value={2}>Within 2 km</option>
                <option value={5}>Within 5 km</option>
                <option value={10}>Within 10 km</option>
                <option value={20}>Within 20 km</option>
                <option value={50}>Within 50 km</option>
              </select>
            )}

            {geoState === "granted" ? (
              <>
                <button
                  type="button"
                  onClick={handleRefreshFilters}
                  disabled={nearbyLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  {nearbyLoading ? "Searching…" : "Refresh"}
                </button>
                <button
                  type="button"
                  onClick={handleClearNearby}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:border-red-400/40 hover:text-red-400"
                >
                  Clear
                </button>
              </>
            ) : geoState === "loading" ? (
              <div className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400">
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Getting location…
              </div>
            ) : (
              <button
                type="button"
                onClick={handleUseMyLocation}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-400/30 bg-indigo-400/10 px-4 py-2 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-400/20"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                Use my location
              </button>
            )}

            {locationLabel && (
              <span className="max-w-56 truncate rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-300">
                {locationLabel}
              </span>
            )}

            {geoState === "denied" && (
              <span className="text-xs text-red-400">Location access denied. Please allow in browser settings.</span>
            )}
            {nearbyError && <span className="text-xs text-red-400">{nearbyError}</span>}
          </div>
        </div>

        {/* Nearby status */}
        {(geoState === "granted" || nearbyLoading) && (
          <div className="mt-4 border-t border-white/10 pt-4">
            {nearbyLoading ? (
              <p className="text-xs text-slate-400">Running one nearby query with all selected filters…</p>
            ) : nearbyItems.length === 0 ? (
              <p className="py-2 text-sm text-slate-500">
                No properties found within {nearbyRadius} km of this location.
              </p>
            ) : (
              <p className="text-xs text-slate-300">
                Showing <span className="font-semibold text-cyan-300">{nearbyItems.length}</span> nearby propert{nearbyItems.length === 1 ? "y" : "ies"} with current filters applied.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
      >
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-7">
          {/* Global keyword */}
          <div>
            <label className="mb-1 block text-xs text-slate-400">Global Search</label>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Title, city, address..."
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-cyan-400"
            />
            {isQueryTooShort && (
              <p className="mt-1 text-[11px] text-amber-300">Enter at least 3 characters to trigger search.</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Search Mode</label>
            <select
              value={searchMode}
              onChange={(e) => {
                setSearchMode((e.target.value as SearchMode) === "semantic" ? "semantic" : "keyword");
                setPage(1);
              }}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            >
              <option value="keyword">Keyword</option>
              <option value="semantic">Semantic</option>
            </select>
          </div>

          {/* Listing type */}
          <div>
            <label className="mb-1 block text-xs text-slate-400">Listing Type</label>
            <select
              value={listingType}
              onChange={(e) => {
                setListingType(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            >
              <option value="">All</option>
              <option value="BUY">Buy</option>
              <option value="RENT">Rent</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-400">Featured</label>
            <select
              value={featured}
              onChange={(e) => {
                setFeatured(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            >
              <option value="">All</option>
              <option value="true">Featured only</option>
            </select>
          </div>

          {/* City / Location */}
          <div>
            <label className="mb-1 block text-xs text-slate-400">Location</label>
            <select
              value={city}
              onChange={(e) => {
                const val = e.target.value;
                setCity(val);
                setPage(1);
                if (val) localStorage.setItem("selectedCity", val);
                else localStorage.removeItem("selectedCity");
              }}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            >
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>
          </div>

          {/* Property type */}
          <div>
            <label className="mb-1 block text-xs text-slate-400">Property Type</label>
            <select
              value={typeSlug}
              onChange={(e) => {
                setTypeSlug(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            >
              <option value="">All Types</option>
              {propertyTypes.map((pt) => (
                <option key={pt.id} value={pt.slug}>
                  {pt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search button */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              onClick={() => setPage(1)}
              className="w-full rounded-xl bg-cyan-400 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset filters"
              className="rounded-xl border border-white/20 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-300"
            >
              ⟲
            </button>
            <button
              type="button"
              onClick={handleRefreshFilters}
              title="Refresh results"
              className="rounded-xl border border-white/20 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-300"
            >
              ↻
            </button>
          </div>
        </div>
      </form>

      {/* Results header */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {loading ? "Loading…" : `${total.toLocaleString()} propert${total === 1 ? "y" : "ies"} found`}
        </p>
        <div className="flex items-center gap-2">
          {typeof remainingLeadCredits === "number" && (
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              Lead credits: {remainingLeadCredits}
            </span>
          )}
          {listingType && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                listingType === "BUY"
                  ? "bg-green-400/10 text-green-400"
                  : "bg-indigo-400/10 text-indigo-400"
              }`}
            >
              {listingType === "BUY" ? "For Sale" : "For Rent"}
            </span>
          )}
          {featured === "true" && (
            <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
              Featured only
            </span>
          )}
          {city && (
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              📍 {city}
            </span>
          )}
          {hasValidSearchQuery && (
            <span className="rounded-full bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-300">
              {searchMode === "semantic" ? "Semantic mode" : "Keyword mode"}
            </span>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
          <p className="text-slate-400">No properties found matching your filters.</p>
          <button
            onClick={() => {
              setQuery("");
              setSearchMode("keyword");
              setFeatured("");
              setListingType("");
              setCity("");
              setTypeSlug("");
              setPage(1);
            }}
            className="mt-4 text-sm text-cyan-400 hover:text-cyan-300"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((prop) => (
            <div
              key={prop.id}
              className="group rounded-2xl border border-white/10 bg-white/5 p-4 shadow backdrop-blur transition hover:border-cyan-400/40 hover:bg-white/8"
              role="button"
              tabIndex={0}
              onClick={() => openPropertyView(prop)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openPropertyView(prop);
                }
              }}
            >
              {/* Image placeholder */}
              <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-slate-800">
                {prop.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={prop.images[0].url}
                    alt={prop.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">🏠</span>
                )}
              </div>

              {/* Badge */}
              <div className="mb-2 flex items-center gap-2">
                {nearbyDistanceById.has(prop.id) && (
                  <span className="rounded-full bg-green-400/10 px-2 py-0.5 text-xs font-semibold text-green-400">
                    📍 {nearbyDistanceById.get(prop.id)} km away
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    prop.listingType === "BUY"
                      ? "bg-green-400/10 text-green-400"
                      : "bg-indigo-400/10 text-indigo-400"
                  }`}
                >
                  {prop.listingType === "BUY" ? "For Sale" : "For Rent"}
                </span>
                {prop.isFeatured && (
                  <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-semibold text-amber-300">
                    ⭐ Featured
                  </span>
                )}
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">
                  {prop.type.name}
                </span>
              </div>

              <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-white">
                {prop.title}
              </h3>
              <p className="mb-3 text-xs text-slate-400">
                📍 {prop.city} — {prop.address}
              </p>

              <div className="mb-3 flex gap-4 text-xs text-slate-300">
                {prop.beds > 0 && <span>🛏 {prop.beds} beds</span>}
                {prop.baths > 0 && <span>🚿 {prop.baths} baths</span>}
                <span>📐 {prop.areaSqft.toLocaleString()} sqft</span>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-cyan-300">
                  ${Number(prop.price).toLocaleString()}
                  {prop.listingType === "RENT" && (
                    <span className="text-xs font-normal text-slate-400"> /yr</span>
                  )}
                </p>
                {prop.agent && (
                  <p className="text-xs text-slate-500">by {prop.agent.name}</p>
                )}
              </div>

              <div className="mt-3 border-t border-white/10 pt-3">
                {canManageListing(prop) ? (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/agent/properties/${prop.publicId ?? prop.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
                    >
                      View
                    </Link>
                    <Link
                      href={`/agent/properties/${prop.publicId ?? prop.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-lg bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/30"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteListing(prop.id);
                      }}
                      className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <>
                    {revealedContacts[prop.id] ? (
                      <div className="space-y-1 text-xs text-slate-300">
                        {revealedContacts[prop.id]?.phone && <p>📞 {revealedContacts[prop.id]?.phone}</p>}
                        {revealedContacts[prop.id]?.whatsapp && <p>🟢 {revealedContacts[prop.id]?.whatsapp}</p>}
                        {revealedContacts[prop.id]?.email && <p>✉️ {revealedContacts[prop.id]?.email}</p>}
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleRevealContact(prop.id);
                        }}
                        className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30"
                      >
                        {viewerRole === "BUYER" ? "Reveal Contact (1 credit)" : "Reveal Contact"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-10" />
      {loadingMore && (
        <div className="mt-2 text-center text-sm text-slate-400">Loading more properties...</div>
      )}
      {!loading && items.length > 0 && items.length >= total && (
        <div className="mt-2 text-center text-xs text-slate-500">You have reached the end.</div>
      )}
    </>
  );
}

export default function PropertiesPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.14),_transparent_40%)]" />

      <main className="relative mx-auto max-w-6xl px-6 py-8 md:px-10">
        <Navbar />

        <div className="mt-8">
          <h1 className="mb-2 text-3xl font-bold">
            Property{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              Listings
            </span>
          </h1>
          <p className="mb-6 text-slate-400">
            Browse verified buy &amp; rent listings across all cities.
          </p>

          <Suspense>
            <PropertiesContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
