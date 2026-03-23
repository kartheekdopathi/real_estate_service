import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";

import { decodePropertyId } from "@/lib/property-id-token";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/server-auth";
import { deleteYouTubeVideo, isYouTubeUploadEnabled, uploadVideoToYouTube } from "@/lib/youtube";

const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB
const MAX_DURATION_SEC = 120; // 2 minutes
const ALLOWED_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;
  const id = decodePropertyId((await params).id);
  if (id == null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const folderId = String(id);

  const user = await getAuthUser(request);
  if (!user || (user.role !== "AGENT" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const property = await db.property.findFirst({
    where: user.role === "ADMIN" ? { id } : { id, agentId: user.id },
    select: { id: true, title: true, city: true, listingType: true },
  });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const existingVideo = await db.propertyVideo.findFirst({
    where: { propertyId: id },
    select: { id: true },
  });
  if (existingVideo) {
    return NextResponse.json(
      { error: "A video is already attached to this property" },
      { status: 400 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  const file = formData.get("video") as File | null;
  const durationSec = Number(formData.get("durationSec") ?? 0);

  if (!file) {
    return NextResponse.json({ error: "No video file provided" }, { status: 400 });
  }

  const ext = ALLOWED_MIME[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: `Invalid video type: ${file.type}. Use mp4, webm, or mov.` },
      { status: 400 },
    );
  }

  if (file.size > MAX_VIDEO_SIZE) {
    return NextResponse.json({ error: "Video exceeds the 200 MB limit." }, { status: 400 });
  }

  if (durationSec > MAX_DURATION_SEC) {
    return NextResponse.json({ error: "Video must be 2 minutes (120 s) or less." }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "properties", folderId);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (isYouTubeUploadEnabled()) {
    const uploadedVideo = await uploadVideoToYouTube({
      fileBuffer: buffer,
      mimeType: file.type,
      title: `${property.title} | ${property.city} | Real Estate Service`,
      description: `Property video for ${property.title} (${property.listingType}) in ${property.city}. Uploaded from Real Estate Service.`,
      tags: [property.city, property.listingType, "real-estate", "property-video"],
    });

    await db.propertyVideo.create({
      data: {
        propertyId: id,
        provider: "youtube",
        playbackUrl: uploadedVideo.watchUrl,
        posterUrl: uploadedVideo.thumbnailUrl,
        youtubeVideoId: uploadedVideo.videoId,
        embedUrl: uploadedVideo.embedUrl,
        durationSec: Math.round(durationSec),
        status: uploadedVideo.status,
      },
    });

    return NextResponse.json({
      video: {
        provider: "youtube",
        playbackUrl: uploadedVideo.watchUrl,
        posterUrl: uploadedVideo.thumbnailUrl,
        youtubeVideoId: uploadedVideo.videoId,
        embedUrl: uploadedVideo.embedUrl,
        durationSec: Math.round(durationSec),
        status: uploadedVideo.status,
      },
    });
  }

  await mkdir(uploadDir, { recursive: true });
  const filename = `video_${Date.now()}.${ext}`;
  await writeFile(path.join(uploadDir, filename), buffer);

  const videoUrl = `/uploads/properties/${folderId}/${filename}`;

  await db.propertyVideo.create({
    data: {
      propertyId: id,
      provider: "local",
      playbackUrl: videoUrl,
      durationSec: Math.round(durationSec),
      status: "ready",
    },
  });

  return NextResponse.json({
    video: { provider: "local", playbackUrl: videoUrl, durationSec: Math.round(durationSec), status: "ready" },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;
  const id = decodePropertyId((await params).id);
  if (id == null) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const user = await getAuthUser(request);
  if (!user || (user.role !== "AGENT" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const property = await db.property.findFirst({
    where: { id, agentId: user.id },
    select: { id: true },
  });
  if (!property && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const video = await db.propertyVideo.findFirst({
    where: { propertyId: id },
    select: { id: true, provider: true, playbackUrl: true, posterUrl: true, youtubeVideoId: true },
  });
  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  if (video.provider === "youtube" && video.youtubeVideoId) {
    try {
      await deleteYouTubeVideo(video.youtubeVideoId);
    } catch {
      return NextResponse.json({ error: "Video removed from app failed because YouTube delete was not successful." }, { status: 502 });
    }
  }

  await db.propertyVideo.delete({ where: { id: video.id } });

  for (const maybeUrl of [video.playbackUrl, video.posterUrl]) {
    if (!maybeUrl || !maybeUrl.startsWith("/uploads/")) continue;
    const abs = path.join(process.cwd(), "public", maybeUrl.replace(/^\//, ""));
    try {
      await unlink(abs);
    } catch {
      // Ignore missing file errors.
    }
  }

  return NextResponse.json({ ok: true });
}
