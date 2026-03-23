import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  roleName: z.string().min(2).max(50).optional(),
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

  const role = await db.role.findUnique({
    where: { id },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  return NextResponse.json({ role });
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

  const updated = await db.role.update({
    where: { id },
    data: {
      ...(parsed.data.roleName ? { roleName: parsed.data.roleName.toUpperCase() } : {}),
      ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
    },
  });

  return NextResponse.json({ role: updated });
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

  const inUse = await db.user.count({ where: { roleId: id } });

  if (inUse > 0) {
    return NextResponse.json({ error: "Role is assigned to users. Deactivate instead of delete." }, { status: 409 });
  }

  await db.role.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
