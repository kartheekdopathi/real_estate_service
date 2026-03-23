import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  menus: z.array(
    z.object({
      menuId: z.coerce.number().int(),
      canView: z.boolean(),
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
      roleMenus: {
        include: {
          menu: true,
        },
      },
    },
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  return NextResponse.json({ roleId, menus: role.roleMenus });
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
    parsed.data.menus.map((m) =>
      db.roleMenuAccess.upsert({
        where: { roleId_menuId: { roleId, menuId: m.menuId } },
        update: { canView: m.canView },
        create: { roleId, menuId: m.menuId, canView: m.canView },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
