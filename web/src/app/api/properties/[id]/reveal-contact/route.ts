import { NextRequest, NextResponse } from "next/server";

import { decodePropertyId } from "@/lib/property-id-token";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/server-auth";

function parseId(idRaw: string) {
  return decodePropertyId(idRaw);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;
  const propertyId = parseId((await params).id);
  if (!propertyId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const property = await db.property.findFirst({
    where: { id: propertyId, active: true, status: "PUBLISHED" },
    select: {
      id: true,
      agentId: true,
      contactPhone: true,
      contactWhatsApp: true,
      contactEmail: true,
      title: true,
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  if (!property.contactPhone && !property.contactWhatsApp && !property.contactEmail) {
    return NextResponse.json({ error: "No contact details available" }, { status: 404 });
  }

  const isOwner = property.agentId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isOwner && !isAdmin && user.role === "BUYER") {
    const existingReveal = await db.contactReveal.findUnique({
      where: { userId_propertyId: { userId: user.id, propertyId } },
      select: { id: true },
    });

    if (!existingReveal) {
      const actor = await db.user.findUnique({
        where: { id: user.id },
        select: { leadCredits: true, isInternal: true },
      });

      if (!actor) {
        return NextResponse.json(
          { error: "No lead credits. Please purchase credits to reveal contact." },
          { status: 402 },
        );
      }

      if (!actor.isInternal && actor.leadCredits <= 0) {
        return NextResponse.json(
          { error: "No lead credits. Please purchase credits to reveal contact." },
          { status: 402 },
        );
      }

      if (actor.isInternal) {
        await db.contactReveal.create({
          data: { userId: user.id, propertyId },
        });
      } else {
        await db.$transaction([
          db.user.update({
            where: { id: user.id },
            data: { leadCredits: { decrement: 1 } },
          }),
          db.contactReveal.create({
            data: { userId: user.id, propertyId },
          }),
        ]);
      }
    }
  }

  const me = await db.user.findUnique({
    where: { id: user.id },
    select: { leadCredits: true },
  });

  return NextResponse.json({
    propertyId,
    title: property.title,
    contact: {
      phone: property.contactPhone,
      whatsapp: property.contactWhatsApp,
      email: property.contactEmail,
    },
    remainingLeadCredits: me?.leadCredits ?? 0,
  });
}
