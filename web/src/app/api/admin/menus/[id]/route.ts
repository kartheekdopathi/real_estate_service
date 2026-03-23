import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  key: z.string().min(2).max(80).optional(),
  title: z.string().min(2).max(80).optional(),
  path: z.string().min(1).max(160).optional(),
  icon: z.string().max(80).nullable().optional(),
  parentId: z.coerce.number().int().nullable().optional(),
  sortOrder: z.number().int().optional(),
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

  const menu = await db.menu.findUnique({ where: { id } });

  if (!menu) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  }

  return NextResponse.json({ menu });
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

  const updated = await db.menu.update({
    where: { id },
    data: {
      ...(parsed.data.key ? { key: parsed.data.key } : {}),
      ...(parsed.data.title ? { title: parsed.data.title } : {}),
      ...(parsed.data.path ? { path: parsed.data.path } : {}),
      ...(parsed.data.icon !== undefined ? { icon: parsed.data.icon } : {}),
      ...(parsed.data.parentId !== undefined ? { parentId: parsed.data.parentId } : {}),
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
      ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
    },
  });

  return NextResponse.json({ menu: updated });
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

  await db.menu.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
