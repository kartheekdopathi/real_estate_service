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

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = Number((await params).userId);
  if (isNaN(userId)) return NextResponse.json({ error: "Invalid userId" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      userPermissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ userId, permissions: user.userPermissions });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = Number((await params).userId);
  if (isNaN(userId)) return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  await db.$transaction(
    parsed.data.permissions.map((p) =>
      db.userPermission.upsert({
        where: { userId_permissionId: { userId, permissionId: p.permissionId } },
        update: { canAccess: p.canAccess },
        create: { userId, permissionId: p.permissionId, canAccess: p.canAccess },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
