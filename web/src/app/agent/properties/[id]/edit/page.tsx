"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import Navbar from "@/components/Navbar";
import { getVideoEmbedUrl, isYouTubeVideo, type PropertyVideoRecord } from "@/lib/property-video";

type FormState = {
  title: string;
  description: string;
  price: string;
  beds: string;
  baths: string;
  areaSqft: string;
  city: string;
  address: string;
  listingType: "BUY" | "RENT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  contactPhone: string;
  contactWhatsApp: string;
  contactEmail: string;
};

type PropertyImage = { id: number; url: string };
type PropertyVideo = PropertyVideoRecord;

export default function AgentPropertyEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savePhase, setSavePhase] = useState("");
  const [error, setError] = useState("");
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaSuccess, setMediaSuccess] = useState("");
  const [canonicalRouteId, setCanonicalRouteId] = useState("");
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [videos, setVideos] = useState<PropertyVideo[]>([]);
  const [imageQueue, setImageQueue] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [mediaError, setMediaError] = useState("");
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    price: "",
    beds: "",
    baths: "",
    areaSqft: "",
    city: "",
    address: "",
    listingType: "BUY",
    status: "DRAFT",
    contactPhone: "",
    contactWhatsApp: "",
    contactEmail: "",
  });

  const effectiveRouteId = canonicalRouteId || params?.id || "";
  const hasPendingMedia = imageQueue.length > 0 || Boolean(videoFile);

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

      const p = data.property;
      if (typeof p.publicId === "string" && p.publicId.length > 0) {
        setCanonicalRouteId(p.publicId);
        if (p.publicId !== id) {
          router.replace(`/agent/properties/${p.publicId}/edit`);
        }
      }
      setForm({
        title: p.title ?? "",
        description: p.description ?? "",
        price: String(p.price ?? ""),
        beds: p.beds != null ? String(p.beds) : "",
        baths: p.baths != null ? String(p.baths) : "",
        areaSqft: p.areaSqft != null ? String(p.areaSqft) : "",
        city: p.city ?? "",
        address: p.address ?? "",
        listingType: p.listingType ?? "BUY",
        status: p.status ?? "DRAFT",
        contactPhone: p.contactPhone ?? "",
        contactWhatsApp: p.contactWhatsApp ?? "",
        contactEmail: p.contactEmail ?? "",
      });
      setImages((p.images ?? []) as PropertyImage[]);
      setVideos((p.videos ?? []) as PropertyVideo[]);
      setLoading(false);
    };

    void run();
  }, [params?.id, router]);

  const onImagePick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;
    const next = [...imageQueue, ...picked].slice(0, 3);
    setImageQueue(next);
  };

  const onVideoPick = (e: ChangeEvent<HTMLInputElement>) => {
    setMediaError("");
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const vid = document.createElement("video");
    vid.preload = "metadata";
    vid.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      if (vid.duration > 120) {
        setMediaError(`Video is ${Math.round(vid.duration)}s. Max 120s allowed.`);
        return;
      }
      setVideoDuration(vid.duration);
      setVideoFile(file);
    };
    vid.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setMediaError("Could not read video metadata.");
    };
    vid.src = objectUrl;
  };

  const reloadProperty = async () => {
    const id = params?.id;
    if (!id) return;
    const res = await fetch(`/api/properties/${id}`, { credentials: "include", cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.property) return;
    if (typeof data.property.publicId === "string" && data.property.publicId.length > 0) {
      setCanonicalRouteId(data.property.publicId);
    }
    setImages((data.property.images ?? []) as PropertyImage[]);
    setVideos((data.property.videos ?? []) as PropertyVideo[]);
  };

  const uploadImagesRequest = async (id: string) => {
    if (imageQueue.length === 0) return;

    const fd = new FormData();
    for (const file of imageQueue) fd.append("images", file);

    const res = await fetch(`/api/properties/${id}/images`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error ?? "Image upload failed");
    }

    setImageQueue([]);
  };

  const uploadVideoRequest = async (id: string) => {
    if (!videoFile) return;

    const fd = new FormData();
    fd.append("video", videoFile);
    fd.append("durationSec", String(Math.round(videoDuration)));

    const res = await fetch(`/api/properties/${id}/videos`, {
      method: "POST",
      credentials: "include",
      body: fd,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error ?? "Video upload failed");
    }

    setVideoFile(null);
    setVideoDuration(0);
  };

  const uploadImages = async () => {
    const id = params?.id;
    if (!id || imageQueue.length === 0) return;
    setMediaBusy(true);
    setMediaError("");
    setMediaSuccess("");
    try {
      await uploadImagesRequest(id);
      await reloadProperty();
      setMediaSuccess("Images uploaded successfully.");
    } catch (uploadError) {
      setMediaError(uploadError instanceof Error ? uploadError.message : "Image upload failed");
    } finally {
      setMediaBusy(false);
    }
  };

  const uploadVideo = async () => {
    const id = params?.id;
    if (!id || !videoFile) return;
    setMediaBusy(true);
    setMediaError("");
    setMediaSuccess("");
    try {
      await uploadVideoRequest(id);
      await reloadProperty();
      setMediaSuccess("Video uploaded successfully.");
    } catch (uploadError) {
      setMediaError(uploadError instanceof Error ? uploadError.message : "Video upload failed");
    } finally {
      setMediaBusy(false);
    }
  };

  const removeImage = async (imageId: number) => {
    const id = params?.id;
    if (!id) return;
    setMediaBusy(true);
    setMediaError("");
    setMediaSuccess("");
    const res = await fetch(`/api/properties/${id}/images?imageId=${imageId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMediaError(data?.error ?? "Image delete failed");
      setMediaBusy(false);
      return;
    }
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    setMediaSuccess("Image deleted successfully.");
    setMediaBusy(false);
  };

  const removeVideo = async () => {
    const id = params?.id;
    if (!id) return;
    setMediaBusy(true);
    setMediaError("");
    setMediaSuccess("");
    const res = await fetch(`/api/properties/${id}/videos`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMediaError(data?.error ?? "Video delete failed");
      setMediaBusy(false);
      return;
    }
    setVideos([]);
    setMediaSuccess("Video deleted successfully.");
    setMediaBusy(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavePhase("Saving property details...");
    setError("");
    setMediaError("");
    setMediaSuccess("");

    const id = params?.id;
    const payload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      ...(form.beds !== "" && Number.isFinite(Number(form.beds)) ? { beds: Number(form.beds) } : {}),
      ...(form.baths !== "" && Number.isFinite(Number(form.baths)) ? { baths: Number(form.baths) } : {}),
      ...(form.areaSqft !== "" && Number.isFinite(Number(form.areaSqft)) ? { areaSqft: Number(form.areaSqft) } : {}),
      city: form.city,
      address: form.address,
      listingType: form.listingType,
      status: form.status,
      contactPhone: form.contactPhone || null,
      contactWhatsApp: form.contactWhatsApp || null,
      contactEmail: form.contactEmail || null,
    };

    const res = await fetch(`/api/properties/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Update failed");
      setSavePhase("");
      setSaving(false);
      return;
    }

    if (typeof data?.property?.id === "number") {
      const nextCanonicalId = data?.property?.publicId;
      if (typeof nextCanonicalId === "string" && nextCanonicalId.length > 0) {
        setCanonicalRouteId(nextCanonicalId);
      }
    }

    try {
      if (id && imageQueue.length > 0) {
        setSavePhase(`Uploading ${imageQueue.length} image(s)...`);
        await uploadImagesRequest(id);
      }
      if (id && videoFile) {
        setSavePhase("Uploading video...");
        await uploadVideoRequest(id);
      }
      if (id) {
        setSavePhase("Refreshing property...");
        await reloadProperty();
      }
    } catch (uploadError) {
      setMediaError(uploadError instanceof Error ? uploadError.message : "Media upload failed");
      setSavePhase("");
      setSaving(false);
      return;
    }

    setSavePhase("Done");
    router.push(`/agent/properties/${canonicalRouteId || data?.property?.publicId || id}`);
    router.refresh();
  };

  if (loading) return <div className="p-8 text-slate-300">Loading property...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-5xl px-6 py-8 md:px-10">
        <Navbar />

        <div className="mt-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Edit Property</h1>
          <Link href={`/agent/properties/${effectiveRouteId}`} className="rounded-lg border border-white/20 px-3 py-2 text-sm">Back</Link>
        </div>

        <form id="property-edit-form" onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-slate-400">Title</label>
              <input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-slate-400">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className="min-h-28 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Price</label>
              <input type="number" value={form.price} onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Listing Type</label>
              <select value={form.listingType} onChange={(e) => setForm((s) => ({ ...s, listingType: e.target.value as "BUY" | "RENT" }))} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm">
                <option value="BUY">BUY</option>
                <option value="RENT">RENT</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">City</label>
              <input value={form.city} onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Address</label>
              <input value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Status</label>
              <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED" }))} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm">
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Phone</label>
              <input value={form.contactPhone} onChange={(e) => setForm((s) => ({ ...s, contactPhone: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">WhatsApp</label>
              <input value={form.contactWhatsApp} onChange={(e) => setForm((s) => ({ ...s, contactWhatsApp: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Contact Email</label>
              <input type="email" value={form.contactEmail} onChange={(e) => setForm((s) => ({ ...s, contactEmail: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Beds</label>
              <input type="number" min={0} value={form.beds} onChange={(e) => setForm((s) => ({ ...s, beds: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Baths</label>
              <input type="number" min={0} value={form.baths} onChange={(e) => setForm((s) => ({ ...s, baths: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Area (sqft)</label>
              <input type="number" min={1} value={form.areaSqft} onChange={(e) => setForm((s) => ({ ...s, areaSqft: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm" />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

        </form>

        <section className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Media (Images & Video)</h2>

          <div>
            <p className="mb-2 text-sm text-slate-300">Existing Images ({images.length}/3)</p>
            {images.length === 0 ? (
              <p className="text-xs text-slate-500">No images uploaded.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {images.map((img) => (
                  <div key={img.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="property" className="h-24 w-full rounded object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      disabled={mediaBusy || saving}
                      className="mt-2 w-full rounded bg-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/30 disabled:opacity-60"
                    >
                      Delete Image
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={onImagePick} />
              {imageQueue.length > 0 && (
                <span className="text-xs text-slate-400">Selected: {imageQueue.length} image(s)</span>
              )}
              <button
                type="button"
                onClick={uploadImages}
                disabled={mediaBusy || saving || imageQueue.length === 0}
                className="rounded bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-60"
              >
                Upload {imageQueue.length > 0 ? `(${imageQueue.length})` : ""}
              </button>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="mb-2 text-sm text-slate-300">Video (max 1)</p>
            {videos.length > 0 ? (
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                {isYouTubeVideo(videos[0]) ? (
                  <div className="aspect-video overflow-hidden rounded">
                    <iframe
                      src={getVideoEmbedUrl(videos[0])}
                      title="Property video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                ) : (
                  <video src={videos[0].playbackUrl} controls className="max-h-64 w-full rounded" />
                )}
                <button
                  type="button"
                  onClick={removeVideo}
                  disabled={mediaBusy || saving}
                  className="mt-3 rounded bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30 disabled:opacity-60"
                >
                  Delete Video
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={onVideoPick} />
                {videoFile && <span className="text-xs text-slate-400">Selected: {videoFile.name}</span>}
                <button
                  type="button"
                  onClick={uploadVideo}
                  disabled={mediaBusy || saving || !videoFile}
                  className="rounded bg-cyan-500/20 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-60"
                >
                  Upload Video
                </button>
              </div>
            )}
          </div>

          {mediaError && <p className="text-sm text-red-400">{mediaError}</p>}
          {mediaSuccess && <p className="text-sm text-emerald-400">{mediaSuccess}</p>}
          {hasPendingMedia && !saving && (
            <p className="text-sm text-amber-300">
              Pending media: {imageQueue.length > 0 ? `${imageQueue.length} image(s)` : ""}
              {imageQueue.length > 0 && videoFile ? " and " : ""}
              {videoFile ? "1 video" : ""}. Save Changes will upload them automatically.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          {saving && savePhase && <p className="mb-3 text-sm text-cyan-300">{savePhase}</p>}
          <button
            type="submit"
            form="property-edit-form"
            disabled={saving}
            className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {saving ? (savePhase || "Saving...") : hasPendingMedia ? "Save Changes + Upload Media" : "Save Changes"}
          </button>
        </section>
      </main>
    </div>
  );
}
