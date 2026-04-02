import Link from "next/link";

import LocationSearchBar from "@/components/LocationSearchBar";
import Navbar from "@/components/Navbar";
import { encodePropertyId } from "@/lib/property-id-token";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const [featuredProperties, citiesResult] = await Promise.all([
    prisma.property.findMany({
      where: {
        active: true,
        status: "PUBLISHED",
        isFeatured: true,
      },
      select: {
        id: true,
        title: true,
        city: true,
        address: true,
        listingType: true,
        price: true,
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          select: { url: true },
        },
        type: {
          select: { name: true },
        },
      },
      orderBy: [{ featuredUntil: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
    db.property.groupBy({
      by: ["city"],
      where: { active: true, status: "PUBLISHED" },
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
      take: 8,
    }),
  ]);

  const topCities = (citiesResult as { city: string; _count: { city: number } }[]).map((r) => ({
    name: r.city,
    count: r._count.city,
  }));

  type FeaturedProperty = (typeof featuredProperties)[number];

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.28),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.24),_transparent_35%)]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 md:px-10">
        <Navbar />

        <section className="grid flex-1 items-center gap-8 py-10 md:grid-cols-2 md:py-14">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">
              Smart search • Verified listings • Fast inquiry
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Discover your next
              <span className="bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                {" "}dream property
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-slate-300">
              A modern platform for buyers, agents, and admins. Browse listings, post properties,
              and manage your real estate portfolio — all in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/properties"
                className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Explore Listings
              </Link>
              <Link
                href="/signup?role=AGENT"
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
              >
                Become an Agent
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/properties?listingType=BUY"
                className="flex items-center gap-2 rounded-xl border border-green-400/20 bg-green-400/5 px-4 py-2.5 text-sm text-green-300 transition hover:border-green-400/40"
              >
                🔑 Buy
              </Link>
              <Link
                href="/properties?listingType=RENT"
                className="flex items-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-400/5 px-4 py-2.5 text-sm text-indigo-300 transition hover:border-indigo-400/40"
              >
                🏙️ Rent
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:border-white/30"
              >
                👤 Sign In
              </Link>
            </div>
          </div>

          <LocationSearchBar />
        </section>

        <section className="pb-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-300/90">Top picks</p>
              <h2 className="text-2xl font-bold md:text-3xl">Featured Properties</h2>
            </div>
            <Link
              href="/properties"
              className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              View all
            </Link>
          </div>

          {featuredProperties.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-slate-300">
              No featured properties available yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProperties.map((prop: FeaturedProperty) => {
                const routeId = encodePropertyId(prop.id);

                return (
                  <Link
                    key={prop.id}
                    href={`/properties/${routeId}`}
                    className="section-card rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-amber-300/35"
                  >
                    <div className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-slate-900/70">
                      {prop.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={prop.images[0].url} alt={prop.title} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-4xl">🏠</span>
                      )}
                    </div>

                    <div className="mb-2 flex items-center gap-2 text-xs">
                      <span className="rounded-full bg-amber-400/10 px-2 py-0.5 font-semibold text-amber-300">⭐ Featured</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${
                          prop.listingType === "BUY"
                            ? "bg-green-400/10 text-green-300"
                            : "bg-indigo-400/10 text-indigo-300"
                        }`}
                      >
                        {prop.listingType === "BUY" ? "For Sale" : "For Rent"}
                      </span>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-slate-400">{prop.type.name}</span>
                    </div>

                    <h3 className="line-clamp-2 text-sm font-semibold">{prop.title}</h3>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                      📍 {prop.city} — {prop.address}
                    </p>
                    <p className="mt-3 text-base font-bold text-cyan-300">
                      ${Number(prop.price).toLocaleString()}
                      {prop.listingType === "RENT" && <span className="text-xs font-normal text-slate-400"> /yr</span>}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Browse by Location */}
        {topCities.length > 0 && (
          <section className="pb-12">
            <div className="mb-5">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-300/90">Explore by area</p>
              <h2 className="text-2xl font-bold md:text-3xl">Browse by Location</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {topCities.map((c) => (
                <Link
                  key={c.name}
                  href={`/properties?city=${encodeURIComponent(c.name)}`}
                  className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/50 hover:bg-white/10"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-lg group-hover:bg-cyan-400/20">
                    📍
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white group-hover:text-cyan-300">{c.name}</p>
                    <p className="text-xs text-slate-400">
                      {c.count} {c.count === 1 ? "property" : "properties"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/properties"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-cyan-300"
              >
                View all listings →
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
