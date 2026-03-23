"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import Navbar from "@/components/Navbar";

type PropertyType = {
  id: number;
  name: string;
  slug: string;
};

const RESIDENTIAL_TYPES = new Set(["apartment-flat", "house", "villa"]);
const LAND_TYPES = new Set(["plot-land", "farm-land"]);
const COMMERCIAL_TYPES = new Set(["office", "shop", "warehouse", "building"]);

type FieldDef = {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  options?: string[];
  placeholder?: string;
};

const FURNISHING_OPTS = ["Furnished", "Semi-Furnished", "Unfurnished"];
const FACING_OPTS = [
  "North", "South", "East", "West",
  "North-East", "North-West", "South-East", "South-West",
];

const EXTRA_FIELDS: Record<string, FieldDef[]> = {
  "apartment-flat": [
    { key: "furnishing",  label: "Furnishing Status",          type: "select", options: FURNISHING_OPTS },
    { key: "floor",       label: "Floor Number",               type: "number", placeholder: "3" },
    { key: "parking",     label: "Parking Spots",              type: "number", placeholder: "1" },
  ],
  house: [
    { key: "furnishing",  label: "Furnishing Status",          type: "select", options: FURNISHING_OPTS },
    { key: "yearBuilt",   label: "Year Built",                 type: "number", placeholder: "2018" },
    { key: "parking",     label: "Parking Spots",              type: "number", placeholder: "2" },
  ],
  villa: [
    { key: "furnishing",  label: "Furnishing Status",          type: "select", options: FURNISHING_OPTS },
    { key: "yearBuilt",   label: "Year Built",                 type: "number", placeholder: "2020" },
    { key: "parking",     label: "Parking Spots",              type: "number", placeholder: "2" },
  ],
  "plot-land": [
    { key: "facing",      label: "Facing Direction",           type: "select", options: FACING_OPTS },
    { key: "roadWidthFt", label: "Road Width (ft)",            type: "number", placeholder: "30" },
  ],
  "farm-land": [
    { key: "facing",      label: "Facing Direction",           type: "select", options: FACING_OPTS },
    { key: "waterSource", label: "Water Source",               type: "text",   placeholder: "Canal / Borehole / Well" },
  ],
  office: [
    { key: "furnishing",  label: "Furnishing",                 type: "select", options: ["Fitted Out", "Shell & Core", "Furnished"] },
    { key: "totalFloors", label: "Total Floors in Building",   type: "number", placeholder: "10" },
    { key: "parking",     label: "Parking Spots",              type: "number", placeholder: "2" },
  ],
  shop: [
    { key: "totalFloors", label: "Number of Floors",           type: "number", placeholder: "1" },
    { key: "parking",     label: "Parking Spots",              type: "number", placeholder: "1" },
  ],
  warehouse: [
    { key: "ceilingHeightFt", label: "Ceiling Height (ft)",   type: "number", placeholder: "20" },
    { key: "parking",         label: "Loading Bays / Parking", type: "number", placeholder: "4" },
  ],
  building: [
    { key: "totalFloors", label: "Total Floors",               type: "number", placeholder: "8" },
    { key: "yearBuilt",   label: "Year Built",                 type: "number", placeholder: "2010" },
    { key: "parking",     label: "Parking Spots",              type: "number", placeholder: "10" },
  ],
};

function buildExtraInit(slug: string): Record<string, string> {
  const init: Record<string, string> = {};
  for (const f of EXTRA_FIELDS[slug] ?? []) {
    init[f.key] = f.type === "select" && f.options?.length ? f.options[0] : "";
  }
  return init;
}

export default function PostPropertyPage() {
  const router = useRouter();

  const [types, setTypes] = useState<PropertyType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [typeSlug, setTypeSlug] = useState("");
  const [listingType, setListingType] = useState<"BUY" | "RENT">("BUY");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [beds, setBeds] = useState("0");
  const [baths, setBaths] = useState("0");
  const [areaSqft, setAreaSqft] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [contactPhone, setContactPhone] = useState("");
  const [contactWhatsApp, setContactWhatsApp] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});

  // Media state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoErr, setVideoErr] = useState("");
  const [uploadStep, setUploadStep] = useState("");

  const isResidential = RESIDENTIAL_TYPES.has(typeSlug);
  const isLand = LAND_TYPES.has(typeSlug);
  const isCommercial = COMMERCIAL_TYPES.has(typeSlug);
  const currentExtraDefs = EXTRA_FIELDS[typeSlug] ?? [];

  const updateExtra = (key: string, value: string) =>
    setExtraFields((prev) => ({ ...prev, [key]: value }));

  const onImagesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const combined = [...imageFiles, ...picked].slice(0, 3);
    const valid = combined.filter(
      (f) =>
        ["image/jpeg", "image/png", "image/webp"].includes(f.type) &&
        f.size <= 5 * 1024 * 1024,
    );
    setImageFiles(valid);
    setImagePreviews(valid.map((f) => URL.createObjectURL(f)));
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    const next = imageFiles.filter((_, i) => i !== idx);
    setImageFiles(next);
    setImagePreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const onVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    setVideoErr("");
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    const ALLOWED_VID = ["video/mp4", "video/webm", "video/quicktime"];
    if (!ALLOWED_VID.includes(file.type)) {
      setVideoErr("Invalid type. Use MP4, WebM, or MOV.");
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setVideoErr("Video too large (max 200 MB).");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const vid = document.createElement("video");
    vid.preload = "metadata";
    vid.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      if (vid.duration > 120) {
        setVideoErr(`Video is ${Math.round(vid.duration)}s. Max 2 minutes allowed.`);
        return;
      }
      setVideoDuration(vid.duration);
      setVideoFile(file);
    };
    vid.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setVideoErr("Could not read video metadata. Try a different file.");
    };
    vid.src = objectUrl;
  };

  useEffect(() => {
    let mounted = true;

    fetch("/api/property-types")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted) return;

        const list = (data?.types ?? []) as PropertyType[];
        setTypes(list);
        if (list.length > 0) {
          const firstSlug = list[0].slug;
          setTypeSlug((prev) => prev || firstSlug);
          setExtraFields(buildExtraInit(firstSlug));
        }
      })
      .catch(() => {
        if (!mounted) return;
        setError("Unable to load property types");
      })
      .finally(() => {
        if (!mounted) return;
        setLoadingTypes(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const onTypeChange = (slug: string) => {
    setTypeSlug(slug);
    setExtraFields(buildExtraInit(slug));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const metadata: Record<string, string | number> = {};
      for (const f of currentExtraDefs) {
        const v = extraFields[f.key] ?? "";
        if (v !== "") metadata[f.key] = f.type === "number" ? Number(v) : v;
      }

      // ── Phase 1: Create property ──
      setUploadStep("Creating property…");
      const payload = {
        typeSlug,
        listingType,
        title,
        description,
        price: Number(price),
        city,
        address,
        beds: isResidential ? Number(beds) : 0,
        baths: isResidential ? Number(baths) : 0,
        areaSqft: Number(areaSqft),
        contactPhone: contactPhone.trim() || undefined,
        contactWhatsApp: contactWhatsApp.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        latitude: latitude.trim() ? Number(latitude) : undefined,
        longitude: longitude.trim() ? Number(longitude) : undefined,
        status,
        metadata,
      };

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Unable to create property");
        setSaving(false);
          setUploadStep("");
        return;
      }

      const propertyId: number = data.property.id;

      // ── Phase 2: Upload images ──
      if (imageFiles.length > 0) {
        setUploadStep(`Uploading ${imageFiles.length} image(s)…`);
        const imgForm = new FormData();
        for (const f of imageFiles) imgForm.append("images", f);
        const imgRes = await fetch(`/api/properties/${propertyId}/images`, {
          method: "POST",
          credentials: "include",
          body: imgForm,
        });
        if (!imgRes.ok) {
          const imgData = await imgRes.json();
          setError(imgData?.error ?? "Image upload failed");
          setSaving(false);
          setUploadStep("");
          return;
        }
      }

      // ── Phase 3: Upload video ──
      if (videoFile) {
        setUploadStep("Uploading video…");
        const vidForm = new FormData();
        vidForm.append("video", videoFile);
        vidForm.append("durationSec", String(Math.round(videoDuration)));
        const vidRes = await fetch(`/api/properties/${propertyId}/videos`, {
          method: "POST",
          credentials: "include",
          body: vidForm,
        });
        if (!vidRes.ok) {
          const vidData = await vidRes.json();
          setError(vidData?.error ?? "Video upload failed");
          setSaving(false);
          setUploadStep("");
          return;
        }
      }

      setSuccess("Property created successfully.");
      setUploadStep("");
      setSaving(false);

      setTimeout(() => {
        router.push("/agent");
        router.refresh();
      }, 900);
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
      setUploadStep("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-5xl px-6 py-8 md:px-10">
        <Navbar />

        <div className="mt-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-cyan-300">Agent</p>
            <h1 className="text-2xl font-bold">Post New Property</h1>
          </div>
          <Link
            href="/agent"
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
          >
            Back to Dashboard
          </Link>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Property Type</label>
              <select
                required
                value={typeSlug}
                onChange={(e) => onTypeChange(e.target.value)}
                disabled={loadingTypes}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
              >
                {types.map((t) => (
                  <option key={t.id} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Listing Type</label>
              <select
                value={listingType}
                onChange={(e) => setListingType(e.target.value as "BUY" | "RENT")}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
              >
                <option value="BUY">BUY</option>
                <option value="RENT">RENT</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-slate-400">Title</label>
              <input
                required
                minLength={3}
                maxLength={140}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                placeholder="Modern Apartment in Dubai Marina"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-slate-400">Description</label>
              <textarea
                required
                minLength={20}
                maxLength={5000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-28 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                placeholder="Write details about the property..."
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Price</label>
              <input
                required
                type="number"
                min={1}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                placeholder="75000"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Contact Phone</label>
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                placeholder="+971 50 000 0000"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">WhatsApp Number</label>
              <input
                value={contactWhatsApp}
                onChange={(e) => setContactWhatsApp(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                placeholder="+971 50 000 0000"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                placeholder="agent@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">
                {isLand ? "Land Area (sqft)" : isCommercial ? "Built-up Area (sqft)" : "Area (sqft)"}
              </label>
              <input
                required
                type="number"
                min={1}
                value={areaSqft}
                onChange={(e) => setAreaSqft(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                placeholder="1200"
              />
            </div>

            {isResidential ? (
              <>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Bedrooms</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={beds}
                    onChange={(e) => setBeds(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-400">Bathrooms</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={baths}
                    onChange={(e) => setBaths(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
              </>
            ) : (
              <div className="md:col-span-2 rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2 text-xs text-slate-400">
                {isLand
                  ? "For land types, bedrooms and bathrooms are auto-set to 0."
                  : "For commercial types, bedrooms and bathrooms are auto-set to 0."}
              </div>
            )}

            {/* ── Type-specific extra fields ── */}
            {currentExtraDefs.length > 0 && (
              <>
                <div className="md:col-span-2 mt-2 border-t border-white/10 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                    {typeSlug.replace(/-/g, " ")} — extra details
                  </p>
                </div>
                {currentExtraDefs.map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-xs text-slate-400">{field.label}</label>
                    {field.type === "select" ? (
                      <select
                        value={extraFields[field.key] ?? ""}
                        onChange={(e) => updateExtra(field.key, e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={extraFields[field.key] ?? ""}
                        onChange={(e) => updateExtra(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        min={field.type === "number" ? 0 : undefined}
                        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                ))}
              </>
            )}

            <div>
              <label className="mb-1 block text-xs text-slate-400">City</label>
              <input
                required
                minLength={2}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                placeholder="Dubai"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-slate-400">Address</label>
              <input
                required
                minLength={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                placeholder="Marina Walk, Dubai"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Latitude (optional)</label>
              <input
                type="number"
                step="0.0000001"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                placeholder="25.0819"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Longitude (optional)</label>
              <input
                type="number"
                step="0.0000001"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm"
                placeholder="55.1367"
              />
            </div>
          </div>

          {/* ── Images ── */}
          <div className="border-t border-white/10 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-400">
              Property Photos
              <span className="ml-2 font-normal normal-case text-slate-400">
                (up to 3 · jpg / png / webp · max 5 MB each)
              </span>
            </p>
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((src, idx) => (
                <div
                  key={idx}
                  className="relative h-24 w-24 overflow-hidden rounded-lg border border-white/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`preview-${idx}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white hover:bg-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {imageFiles.length < 3 && (
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/20 bg-slate-900 hover:bg-slate-800">
                  <span className="text-2xl leading-none text-slate-400">+</span>
                  <span className="text-[10px] text-slate-500">Add photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={onImagesChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* ── Video ── */}
          <div className="border-t border-white/10 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-400">
              Property Video
              <span className="ml-2 font-normal normal-case text-slate-400">
                (1 video · mp4 / webm / mov · max 2 min · max 200 MB)
              </span>
            </p>
            {videoFile ? (
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900 px-3 py-2">
                <span className="text-lg">🎬</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{videoFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {(videoFile.size / 1024 / 1024).toFixed(1)} MB &middot;{" "}
                    {Math.floor(videoDuration / 60)}:{String(Math.round(videoDuration % 60)).padStart(2, "0")} min
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setVideoFile(null); setVideoDuration(0); }}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/20 bg-slate-900 px-4 py-3 hover:bg-slate-800">
                <span className="text-lg">🎬</span>
                <span className="text-sm text-slate-400">Click to upload a video</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={onVideoChange}
                />
              </label>
            )}
            {videoErr && <p className="mt-1 text-xs text-red-400">{videoErr}</p>}
          </div>

          {error && (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || loadingTypes || !typeSlug}
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (uploadStep || "Saving…") : "Create Property"}
          </button>
        </form>
      </main>
    </div>
  );
}
