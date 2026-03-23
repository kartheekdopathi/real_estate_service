import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";
import exifr from "exifr";

import { decodePropertyId } from "@/lib/property-id-token";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/server-auth";

const MAX_IMAGES = 3;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

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
    select: { id: true, latitude: true, longitude: true },
  });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const existingCount: number = await db.propertyImage.count({ where: { propertyId: id } });
  if (existingCount >= MAX_IMAGES) {
    return NextResponse.json(
      { error: `Max ${MAX_IMAGES} images already uploaded` },
      { status: 400 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  const files = formData.getAll("images") as File[];
  if (!files.length) {
    return NextResponse.json({ error: "No images provided" }, { status: 400 });
  }

  if (existingCount + files.length > MAX_IMAGES) {
    return NextResponse.json(
      { error: `Only ${MAX_IMAGES - existingCount} more image(s) allowed` },
      { status: 400 },
    );
  }

  for (const file of files) {
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Invalid type for "${file.name}". Use jpg, png, or webp.` },
        { status: 400 },
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `"${file.name}" exceeds the 5 MB limit.` },
        { status: 400 },
      );
    }
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "properties", folderId);
  await mkdir(uploadDir, { recursive: true });

  const saved: { url: string; sortOrder: number }[] = [];
  const shouldAutofillCoords = property.latitude == null || property.longitude == null;
  let extractedCoords: { latitude: number; longitude: number } | null = null;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const filename = `img_${Date.now()}_${i}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    if (shouldAutofillCoords && !extractedCoords) {
      try {
        const gps = await exifr.gps(buffer);
        if (gps?.latitude != null && gps?.longitude != null) {
          extractedCoords = {
            latitude: Number(gps.latitude),
            longitude: Number(gps.longitude),
          };
        }
      } catch {
        // Ignore EXIF parse errors; image upload should still succeed.
      }
    }

    await writeFile(path.join(uploadDir, filename), buffer);
    saved.push({ url: `/uploads/properties/${folderId}/${filename}`, sortOrder: existingCount + i });
  }

  await db.propertyImage.createMany({
    data: saved.map((img) => ({ propertyId: id, ...img })),
  });

  if (shouldAutofillCoords && extractedCoords) {
    await db.property.update({
      where: { id },
      data: {
        latitude: property.latitude ?? extractedCoords.latitude,
        longitude: property.longitude ?? extractedCoords.longitude,
      },
    });
  }

  return NextResponse.json({
    images: saved,
    extractedCoordinates: extractedCoords,
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

  const imageId = Number(request.nextUrl.searchParams.get("imageId") ?? "");
  if (isNaN(imageId)) {
    return NextResponse.json({ error: "imageId is required" }, { status: 400 });
  }

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

  const image = await db.propertyImage.findFirst({
    where: { id: imageId, propertyId: id },
    select: { id: true, url: true },
  });

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  await db.propertyImage.delete({ where: { id: image.id } });

  if (image.url.startsWith("/uploads/")) {
    const abs = path.join(process.cwd(), "public", image.url.replace(/^\//, ""));
    try {
      await unlink(abs);
    } catch {
      // Ignore missing file errors; DB delete is source of truth.
    }
  }

  return NextResponse.json({ ok: true });
}
