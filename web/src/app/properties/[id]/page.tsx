"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import Navbar from "@/components/Navbar";
import { getVideoEmbedUrl, getVideoPosterUrl, isYouTubeVideo, type PropertyVideoRecord } from "@/lib/property-video";

type PropertyDetails = {
  id: number;
  publicId?: string;
  title: string;
  description: string;
  city: string;
  address: string;
  price: string;
  listingType: "BUY" | "RENT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  contactPhone?: string | null;
  contactWhatsApp?: string | null;
  contactEmail?: string | null;
  isFeatured?: boolean;
  type?: { name: string; slug: string };
  images?: { id: number; url: string }[];
  videos?: PropertyVideoRecord[];
};

type MediaItem =
  | { kind: "image"; id: number; src: string }
  | { kind: "video"; id: number; video: PropertyVideoRecord };

type Viewer = {
  id: number;
  role: "BUYER" | "AGENT" | "ADMIN";
  leadCredits?: number;
};

export default function BuyerPropertyViewPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [error, setError] = useState("");
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [revealingContact, setRevealingContact] = useState(false);
  const [revealedContact, setRevealedContact] = useState<{
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
  } | null>(null);

  useEffect(() => {
    const run = async () => {
      const id = params?.id;
      if (!id) return;

      const meRes = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (!meRes.ok) {
        router.replace(`/login?next=${encodeURIComponent(pathname || `/properties/${id}`)}`);
        return;
      }

      const meData = await meRes.json().catch(() => null);
      if (!meData?.user) {
        router.replace(`/login?next=${encodeURIComponent(pathname || `/properties/${id}`)}`);
        return;
      }

      setViewer({
        id: meData.user.id as number,
        role: meData.user.role as Viewer["role"],
        leadCredits: typeof meData.user.leadCredits === "number" ? meData.user.leadCredits : undefined,
      });

      const res = await fetch(`/api/properties/${id}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(pathname || `/properties/${id}`)}`);
        return;
      }

      if (!res.ok) {
        setError(data?.error ?? "Failed to load property");
        setLoading(false);
        return;
      }

      const p = data.property as PropertyDetails;
      if (typeof p.publicId === "string" && p.publicId.length > 0 && p.publicId !== id) {
        router.replace(`/properties/${p.publicId}`);
      }

      setProperty(p);
      setActiveMediaIndex(0);
      setLoading(false);
    };

    void run();
  }, [params?.id, pathname, router]);

  useEffect(() => {
    if (!zoomOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setZoomOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomOpen]);

  if (loading) {
    return <div className="p-8 text-slate-300">Loading property...</div>;
  }

  if (!property) {
    return <div className="p-8 text-red-300">{error || "Property not found"}</div>;
  }

  const mediaItems: MediaItem[] = [
    ...(property.images ?? []).map((img) => ({ kind: "image" as const, id: img.id, src: img.url })),
    ...(property.videos ?? []).map((vid) => ({ kind: "video" as const, id: vid.id, video: vid })),
  ];
  const activeMedia = mediaItems[activeMediaIndex] ?? null;

  const goPrevMedia = () => {
    if (mediaItems.length <= 1) return;
    setActiveMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const goNextMedia = () => {
    if (mediaItems.length <= 1) return;
    setActiveMediaIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const handleRevealContact = async () => {
    if (!property || revealingContact) return;
    setRevealingContact(true);

    const routeId = property.publicId ?? String(property.id);
    const res = await fetch(`/api/properties/${routeId}/reveal-contact`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json().catch(() => null);

    if (res.status === 402) {
      alert(data?.error ?? "No lead credits. Please purchase credits.");
      setRevealingContact(false);
      return;
    }

    if (!res.ok) {
      alert(data?.error ?? "Unable to reveal contact.");
      setRevealingContact(false);
      return;
    }

    setRevealedContact(data?.contact ?? null);
    if (typeof data?.remainingLeadCredits === "number") {
      setViewer((prev) => (prev ? { ...prev, leadCredits: data.remainingLeadCredits } : prev));
    }
    setRevealingContact(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-5xl px-6 py-8 md:px-10">
        <Navbar />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 section-card no-hover-highlight sc-d1">
          <h1 className="text-2xl font-bold">Property Details</h1>
          <div className="flex gap-2">
            {(viewer?.role === "AGENT" || viewer?.role === "ADMIN") && (
              <Link
                href={`/agent/properties/${property.publicId ?? property.id}`}
                className="rounded-lg bg-indigo-500/20 px-3 py-2 text-sm text-indigo-300"
              >
                Manage Listing
              </Link>
            )}
            <Link href="/properties" className="rounded-lg border border-white/20 px-3 py-2 text-sm">Back</Link>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="section-card sc-d2 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="relative flex h-[380px] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
              {!activeMedia ? (
                <p className="text-sm text-slate-500">No media uploaded.</p>
              ) : activeMedia.kind === "image" ? (
                <button
                  type="button"
                  onClick={() => setZoomOpen(true)}
                  className="h-full w-full"
                  title="Click to zoom"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activeMedia.src} alt="Property" className="h-full w-full object-cover" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setZoomOpen(true)}
                  className="h-full w-full"
                  title="Click to open"
                >
                  {isYouTubeVideo(activeMedia.video) ? (
                    <div className="relative h-full w-full overflow-hidden rounded-xl bg-black">
                      {getVideoPosterUrl(activeMedia.video) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getVideoPosterUrl(activeMedia.video)!} alt="Property video" className="h-full w-full object-cover opacity-80" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-900 text-sm text-cyan-300">YouTube Video</div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25 text-5xl text-white">▶</div>
                    </div>
                  ) : (
                    <video src={activeMedia.video.playbackUrl} controls className="h-full w-full bg-black object-contain" />
                  )}
                </button>
              )}

              {mediaItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrevMedia}
                    className="absolute left-2 rounded-full bg-black/50 px-3 py-1 text-sm text-white hover:bg-black/70"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={goNextMedia}
                    className="absolute right-2 rounded-full bg-black/50 px-3 py-1 text-sm text-white hover:bg-black/70"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {mediaItems.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {mediaItems.map((m, idx) => (
                  <button
                    key={`${m.kind}-${m.id}`}
                    type="button"
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border ${
                      idx === activeMediaIndex ? "border-cyan-400" : "border-white/10"
                    }`}
                  >
                    {m.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.src} alt="thumb" className="h-full w-full object-cover" />
                    ) : (
                      getVideoPosterUrl(m.video) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getVideoPosterUrl(m.video)!} alt="video thumbnail" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-900 text-xs text-cyan-300">
                          ▶ Video
                        </div>
                      )
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <section className="section-card no-hover-highlight sc-d3 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-3 text-sm font-semibold text-cyan-300">Overview</h2>
              <p className="text-xl font-semibold">{property.title}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{property.description}</p>
            </section>

            <section className="section-card sc-d4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-3 text-sm font-semibold text-cyan-300">Pricing & Status</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Price</p>
                  <p>${Number(property.price).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Listing Type</p>
                  <p>{property.listingType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Status</p>
                  <p>{property.status}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Featured</p>
                  <p>{property.isFeatured ? "Yes" : "No"}</p>
                </div>
              </div>
            </section>

            <section className="section-card sc-d5 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-3 text-sm font-semibold text-cyan-300">Location</h2>
              <p>{property.city}</p>
              <p className="text-sm text-slate-400">{property.address}</p>
            </section>

            <section className="section-card sc-d6 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-3 text-sm font-semibold text-cyan-300">Contact</h2>
              {revealedContact ? (
                <>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p>{revealedContact.phone || "—"}</p>
                  <p className="mt-2 text-xs text-slate-400">WhatsApp</p>
                  <p>{revealedContact.whatsapp || "—"}</p>
                  <p className="mt-2 text-xs text-slate-400">Email</p>
                  <p>{revealedContact.email || "—"}</p>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-300">Contact details are hidden.</p>
                  <button
                    type="button"
                    onClick={handleRevealContact}
                    disabled={revealingContact}
                    className="rounded-lg bg-cyan-500/20 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-60"
                  >
                    {revealingContact
                      ? "Revealing..."
                      : viewer?.role === "BUYER"
                        ? "Reveal Contact (1 credit)"
                        : "Reveal Contact"}
                  </button>
                  {typeof viewer?.leadCredits === "number" && (
                    <p className="text-xs text-slate-400">Remaining lead credits: {viewer.leadCredits}</p>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>

        {zoomOpen && activeMedia && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/85 p-4 pt-8"
            onClick={() => setZoomOpen(false)}
          >
            <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                className="absolute right-2 top-2 z-10 rounded bg-black/60 px-3 py-1 text-sm text-white hover:bg-black/80"
              >
                ✕
              </button>

              {activeMedia.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeMedia.src} alt="Zoomed" className="max-h-[85vh] w-full rounded-xl object-contain" />
              ) : (
                isYouTubeVideo(activeMedia.video) ? (
                  <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                    <iframe
                      src={getVideoEmbedUrl(activeMedia.video)}
                      title="Property video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                ) : (
                  <video src={activeMedia.video.playbackUrl} controls autoPlay className="max-h-[85vh] w-full rounded-xl bg-black object-contain" />
                )
              )}

              {mediaItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrevMedia}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-white hover:bg-black/80"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={goNextMedia}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-white hover:bg-black/80"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
