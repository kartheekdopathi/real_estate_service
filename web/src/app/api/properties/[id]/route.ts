import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { decodePropertyId, encodePropertyId } from "@/lib/property-id-token";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/server-auth";

const updateSchema = z.object({
  listingType: z.enum(["BUY", "RENT"]).optional(),
  title: z.string().min(3).max(140).optional(),
  description: z.string().min(20).max(5000).optional(),
  price: z.coerce.number().positive().optional(),
  city: z.string().min(2).max(80).optional(),
  address: z.string().min(3).max(180).optional(),
  contactPhone: z.string().max(30).nullable().optional(),
  contactWhatsApp: z.string().max(30).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  latitude: z.coerce.number().gte(-90).lte(90).nullable().optional(),
  longitude: z.coerce.number().gte(-180).lte(180).nullable().optional(),
  beds: z.coerce.number().int().min(0).optional(),
  baths: z.coerce.number().int().min(0).optional(),
  areaSqft: z.coerce.number().int().positive().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  isFeatured: z.boolean().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

function parseId(idRaw: string) {
  return decodePropertyId(idRaw);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const property = await db.property.findUnique({
    where: { id },
    include: {
      type: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      videos: true,
      agent: { select: { id: true, name: true, email: true } },
    },
  });

  if (!property || !property.active) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const canManage = user.role === "ADMIN" || property.agentId === user.id;
  if (!canManage && property.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ property: { ...property, publicId: encodePropertyId(property.id) } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const user = await getAuthUser(request);
  if (!user || (user.role !== "AGENT" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await db.property.findUnique({
    where: { id },
    select: { id: true, agentId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  if (user.role !== "ADMIN" && existing.agentId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  if (payload.isFeatured) {
    const actor = await db.user.findUnique({
      where: { id: user.id },
      select: { subscriptionPlan: true, isInternal: true },
    });

    if (user.role !== "ADMIN" && !actor?.isInternal && actor?.subscriptionPlan === "FREE") {
      return NextResponse.json(
        { error: "Upgrade plan required to feature listings" },
        { status: 402 },
      );
    }
  }

  const updated = await db.property.update({
    where: { id },
    data: {
      ...(payload.listingType ? { listingType: payload.listingType } : {}),
      ...(payload.title ? { title: payload.title } : {}),
      ...(payload.description ? { description: payload.description } : {}),
      ...(payload.price !== undefined ? { price: payload.price } : {}),
      ...(payload.city ? { city: payload.city } : {}),
      ...(payload.address ? { address: payload.address } : {}),
      ...(payload.contactPhone !== undefined ? { contactPhone: payload.contactPhone } : {}),
      ...(payload.contactWhatsApp !== undefined ? { contactWhatsApp: payload.contactWhatsApp } : {}),
      ...(payload.contactEmail !== undefined ? { contactEmail: payload.contactEmail } : {}),
      ...(payload.latitude !== undefined ? { latitude: payload.latitude } : {}),
      ...(payload.longitude !== undefined ? { longitude: payload.longitude } : {}),
      ...(payload.beds !== undefined ? { beds: payload.beds } : {}),
      ...(payload.baths !== undefined ? { baths: payload.baths } : {}),
      ...(payload.areaSqft !== undefined ? { areaSqft: payload.areaSqft } : {}),
      ...(payload.status ? { status: payload.status } : {}),
      ...(payload.metadata ? { metadataRaw: JSON.stringify(payload.metadata) } : {}),
      ...(payload.isFeatured !== undefined
        ? {
            isFeatured: payload.isFeatured,
            featuredUntil: payload.isFeatured ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
          }
        : {}),
    },
    include: {
      type: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      videos: true,
    },
  });

  return NextResponse.json({ property: { ...updated, publicId: encodePropertyId(updated.id) } });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;
  const id = parseId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const user = await getAuthUser(request);
  if (!user || (user.role !== "AGENT" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await db.property.findUnique({
    where: { id },
    select: { id: true, agentId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  if (user.role !== "ADMIN" && existing.agentId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.property.update({
    where: { id },
    data: {
      active: false,
      status: "ARCHIVED",
      isFeatured: false,
      featuredUntil: null,
    },
  });

  return NextResponse.json({ ok: true });
}
