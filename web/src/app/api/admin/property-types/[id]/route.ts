import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  slug: z.string().min(2).max(80).optional(),
  active: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number((await params).id);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const propertyType = await db.propertyType.findUnique({ where: { id } });

  if (!propertyType) {
    return NextResponse.json({ error: "Property type not found" }, { status: 404 });
  }

  return NextResponse.json({ propertyType });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number((await params).id);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const updated = await db.propertyType.update({
    where: { id },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.slug ? { slug: parsed.data.slug } : {}),
      ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
    },
  });

  return NextResponse.json({ propertyType: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number((await params).id);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const inUse = await db.property.count({ where: { typeId: id } });

  if (inUse > 0) {
    return NextResponse.json({ error: "Property type in use. Deactivate instead of delete." }, { status: 409 });
  }

  await db.propertyType.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
