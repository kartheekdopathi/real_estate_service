"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  beds?: number | null;
  baths?: number | null;
  areaSqft?: number | null;
  type?: { name: string; slug: string };
  images?: { id: number; url: string }[];
  videos?: PropertyVideoRecord[];
};

type MediaItem =
  | { kind: "image"; id: number; src: string }
  | { kind: "video"; id: number; video: PropertyVideoRecord };

type EditableSection = "overview" | "pricing" | "location" | "contact";

type SectionDraft = {
  title: string;
  description: string;
  price: string;
  listingType: "BUY" | "RENT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  beds: string;
  baths: string;
  areaSqft: string;
  city: string;
  address: string;
  contactPhone: string;
  contactWhatsApp: string;
  contactEmail: string;
};

export default function AgentPropertyViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const routeId = params?.id;

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [error, setError] = useState("");
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [canonicalRouteId, setCanonicalRouteId] = useState("");
  const [editingSection, setEditingSection] = useState<EditableSection | null>(null);
  const [sectionSaving, setSectionSaving] = useState(false);
  const [sectionError, setSectionError] = useState("");
  const [sectionSuccess, setSectionSuccess] = useState("");
  const [draft, setDraft] = useState<SectionDraft>({
    title: "",
    description: "",
    price: "",
    listingType: "BUY",
    status: "DRAFT",
    isFeatured: false,
    beds: "",
    baths: "",
    areaSqft: "",
    city: "",
    address: "",
    contactPhone: "",
    contactWhatsApp: "",
    contactEmail: "",
  });

  const effectiveRouteId = canonicalRouteId || routeId || "";

  const syncDraftFromProperty = (p: PropertyDetails) => {
    setDraft({
      title: p.title ?? "",
      description: p.description ?? "",
      price: String(p.price ?? ""),
      listingType: p.listingType ?? "BUY",
      status: p.status ?? "DRAFT",
      isFeatured: Boolean(p.isFeatured),
      beds: p.beds != null ? String(p.beds) : "",
      baths: p.baths != null ? String(p.baths) : "",
      areaSqft: p.areaSqft != null ? String(p.areaSqft) : "",
      city: p.city ?? "",
      address: p.address ?? "",
      contactPhone: p.contactPhone ?? "",
      contactWhatsApp: p.contactWhatsApp ?? "",
      contactEmail: p.contactEmail ?? "",
    });
  };

  useEffect(() => {
    const run = async () => {
      const id = params?.id;
      if (!id) return;

      const res = await fetch(`/api/properties/${id}`, { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Failed to load property");
        setLoading(false);
        return;
      }

      if (typeof data.property?.publicId === "string" && data.property.publicId.length > 0) {
        setCanonicalRouteId(data.property.publicId);
        if (data.property.publicId !== id) {
          router.replace(`/agent/properties/${data.property.publicId}`);
        }
      }

      setProperty(data.property);
      syncDraftFromProperty(data.property);
      setActiveMediaIndex(0);
      setLoading(false);
    };

    void run();
  }, [params?.id, router]);

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

  const handleDelete = async () => {
    if (!property) return;
    if (!confirm("Delete this listing? It will be archived.")) return;

    const res = await fetch(`/api/properties/${effectiveRouteId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      alert("Delete failed");
      return;
    }

    router.push("/agent");
    router.refresh();
  };

  const startSectionEdit = (section: EditableSection) => {
    if (!property) return;
    syncDraftFromProperty(property);
    setSectionError("");
    setSectionSuccess("");
    setEditingSection(section);
  };

  const cancelSectionEdit = () => {
    if (property) {
      syncDraftFromProperty(property);
    }
    setSectionError("");
    setEditingSection(null);
  };

  const saveSection = async (section: EditableSection) => {
    if (!effectiveRouteId) return;
    setSectionSaving(true);
    setSectionError("");
    setSectionSuccess("");

    let payload: Record<string, unknown> = {};

    if (section === "overview") {
      payload = {
        title: draft.title,
        description: draft.description,
      };
    }

    if (section === "pricing") {
      const parsedPrice = Number(draft.price);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        setSectionError("Price must be a positive number.");
        setSectionSaving(false);
        return;
      }
      const parsedBeds = draft.beds !== "" ? Number(draft.beds) : undefined;
      const parsedBaths = draft.baths !== "" ? Number(draft.baths) : undefined;
      const parsedArea = draft.areaSqft !== "" ? Number(draft.areaSqft) : undefined;
      payload = {
        price: parsedPrice,
        listingType: draft.listingType,
        status: draft.status,
        isFeatured: draft.isFeatured,
        ...(parsedBeds !== undefined && Number.isFinite(parsedBeds) ? { beds: parsedBeds } : {}),
        ...(parsedBaths !== undefined && Number.isFinite(parsedBaths) ? { baths: parsedBaths } : {}),
        ...(parsedArea !== undefined && Number.isFinite(parsedArea) ? { areaSqft: parsedArea } : {}),
      };
    }

    if (section === "location") {
      payload = {
        city: draft.city,
        address: draft.address,
      };
    }

    if (section === "contact") {
      payload = {
        contactPhone: draft.contactPhone.trim() || null,
        contactWhatsApp: draft.contactWhatsApp.trim() || null,
        contactEmail: draft.contactEmail.trim() || null,
      };
    }

    const res = await fetch(`/api/properties/${effectiveRouteId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setSectionError(data?.error ?? "Unable to update this section.");
      setSectionSaving(false);
      return;
    }

    const updatedProperty = data?.property as PropertyDetails;
    if (updatedProperty) {
      setProperty(updatedProperty);
      syncDraftFromProperty(updatedProperty);

      if (typeof updatedProperty.publicId === "string" && updatedProperty.publicId.length > 0) {
        setCanonicalRouteId(updatedProperty.publicId);
      }
    }

    setSectionSuccess("Section updated successfully.");
    setEditingSection(null);
    setSectionSaving(false);
  };

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-5xl px-6 py-8 md:px-10">
        <Navbar />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 section-card no-hover-highlight sc-d1">
          <h1 className="text-2xl font-bold">Property Details</h1>
          <div className="flex gap-2">
            <Link href={`/agent/properties/${effectiveRouteId}/edit`} className="rounded-lg bg-indigo-500/20 px-3 py-2 text-sm text-indigo-300">Edit</Link>
            <button onClick={handleDelete} className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300">Delete</button>
            <Link href="/agent" className="rounded-lg border border-white/20 px-3 py-2 text-sm">Back</Link>
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
            {sectionError && <p className="text-sm text-red-400">{sectionError}</p>}
            {sectionSuccess && <p className="text-sm text-emerald-400">{sectionSuccess}</p>}

            <section className="section-card no-hover-highlight sc-d3 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-cyan-300">Overview</h2>
                {editingSection !== "overview" && (
                  <button
                    type="button"
                    onClick={() => startSectionEdit("overview")}
                    className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                  >
                    ✏ Edit
                  </button>
                )}
              </div>

              {editingSection === "overview" ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Title</label>
                    <input
                      value={draft.title}
                      onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Description</label>
                    <textarea
                      value={draft.description}
                      onChange={(e) => setDraft((s) => ({ ...s, description: e.target.value }))}
                      className="min-h-28 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveSection("overview")}
                      disabled={sectionSaving}
                      className="rounded bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:opacity-60"
                    >
                      {sectionSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelSectionEdit}
                      disabled={sectionSaving}
                      className="rounded border border-white/20 px-3 py-1.5 text-xs text-slate-300 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xl font-semibold">{property.title}</p>
                  {property.type?.name && (
                    <p className="mt-1 text-xs text-slate-400">Type: {property.type.name}</p>
                  )}
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{property.description}</p>
                </>
              )}
            </section>

            <section className="section-card sc-d4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-cyan-300">Pricing & Status</h2>
                {editingSection !== "pricing" && (
                  <button
                    type="button"
                    onClick={() => startSectionEdit("pricing")}
                    className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                  >
                    ✏ Edit
                  </button>
                )}
              </div>

              {editingSection === "pricing" ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Price</label>
                      <input
                        type="number"
                        value={draft.price}
                        onChange={(e) => setDraft((s) => ({ ...s, price: e.target.value }))}
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Listing Type</label>
                      <select
                        value={draft.listingType}
                        onChange={(e) => setDraft((s) => ({ ...s, listingType: e.target.value as "BUY" | "RENT" }))}
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                      >
                        <option value="BUY">BUY</option>
                        <option value="RENT">RENT</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Status</label>
                      <select
                        value={draft.status}
                        onChange={(e) => setDraft((s) => ({ ...s, status: e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED" }))}
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="PUBLISHED">PUBLISHED</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={draft.isFeatured}
                          onChange={(e) => setDraft((s) => ({ ...s, isFeatured: e.target.checked }))}
                        />
                        Featured
                      </label>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Beds</label>
                      <input
                        type="number"
                        min={0}
                        value={draft.beds}
                        onChange={(e) => setDraft((s) => ({ ...s, beds: e.target.value }))}
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">Baths</label>
                      <input
                        type="number"
                        min={0}
                        value={draft.baths}
                        onChange={(e) => setDraft((s) => ({ ...s, baths: e.target.value }))}
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs text-slate-400">Area (sqft)</label>
                      <input
                        type="number"
                        min={1}
                        value={draft.areaSqft}
                        onChange={(e) => setDraft((s) => ({ ...s, areaSqft: e.target.value }))}
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveSection("pricing")}
                      disabled={sectionSaving}
                      className="rounded bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:opacity-60"
                    >
                      {sectionSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelSectionEdit}
                      disabled={sectionSaving}
                      className="rounded border border-white/20 px-3 py-1.5 text-xs text-slate-300 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
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
                  {property.beds != null && (
                    <div>
                      <p className="text-xs text-slate-400">Beds</p>
                      <p>{property.beds}</p>
                    </div>
                  )}
                  {property.baths != null && (
                    <div>
                      <p className="text-xs text-slate-400">Baths</p>
                      <p>{property.baths}</p>
                    </div>
                  )}
                  {property.areaSqft != null && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400">Area</p>
                      <p>{property.areaSqft.toLocaleString()} sqft</p>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="section-card sc-d5 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-cyan-300">Location</h2>
                {editingSection !== "location" && (
                  <button
                    type="button"
                    onClick={() => startSectionEdit("location")}
                    className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                  >
                    ✏ Edit
                  </button>
                )}
              </div>

              {editingSection === "location" ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">City</label>
                    <input
                      value={draft.city}
                      onChange={(e) => setDraft((s) => ({ ...s, city: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Address</label>
                    <input
                      value={draft.address}
                      onChange={(e) => setDraft((s) => ({ ...s, address: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveSection("location")}
                      disabled={sectionSaving}
                      className="rounded bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:opacity-60"
                    >
                      {sectionSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelSectionEdit}
                      disabled={sectionSaving}
                      className="rounded border border-white/20 px-3 py-1.5 text-xs text-slate-300 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p>{property.city}</p>
                  <p className="text-sm text-slate-400">{property.address}</p>
                </>
              )}
            </section>

            <section className="section-card sc-d6 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-cyan-300">Contact</h2>
                {editingSection !== "contact" && (
                  <button
                    type="button"
                    onClick={() => startSectionEdit("contact")}
                    className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
                  >
                    ✏ Edit
                  </button>
                )}
              </div>

              {editingSection === "contact" ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Phone</label>
                    <input
                      value={draft.contactPhone}
                      onChange={(e) => setDraft((s) => ({ ...s, contactPhone: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">WhatsApp</label>
                    <input
                      value={draft.contactWhatsApp}
                      onChange={(e) => setDraft((s) => ({ ...s, contactWhatsApp: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Email</label>
                    <input
                      type="email"
                      value={draft.contactEmail}
                      onChange={(e) => setDraft((s) => ({ ...s, contactEmail: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveSection("contact")}
                      disabled={sectionSaving}
                      className="rounded bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:opacity-60"
                    >
                      {sectionSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelSectionEdit}
                      disabled={sectionSaving}
                      className="rounded border border-white/20 px-3 py-1.5 text-xs text-slate-300 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p>{property.contactPhone || "—"}</p>
                  <p className="mt-2 text-xs text-slate-400">WhatsApp</p>
                  <p>{property.contactWhatsApp || "—"}</p>
                  <p className="mt-2 text-xs text-slate-400">Email</p>
                  <p>{property.contactEmail || "—"}</p>
                </>
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
