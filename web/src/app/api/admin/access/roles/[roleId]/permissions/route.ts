import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  permissions: z.array(
    z.object({
      permissionId: z.coerce.number().int(),
      canAccess: z.boolean(),
    })
  ),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ roleId: string }> }) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const roleId = Number((await params).roleId);
  if (isNaN(roleId)) return NextResponse.json({ error: "Invalid roleId" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const role = await db.role.findUnique({
    where: { id: roleId },
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

  return NextResponse.json({ roleId, permissions: role.rolePermissions });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ roleId: string }> }) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const roleId = Number((await params).roleId);
  if (isNaN(roleId)) return NextResponse.json({ error: "Invalid roleId" }, { status: 400 });
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  await db.$transaction(
    parsed.data.permissions.map((p) =>
      db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId: p.permissionId } },
        update: { canAccess: p.canAccess },
        create: { roleId, permissionId: p.permissionId, canAccess: p.canAccess },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
