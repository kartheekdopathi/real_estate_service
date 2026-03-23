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
      userMenus: {
        include: {
          menu: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ userId, menus: user.userMenus });
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
    parsed.data.menus.map((m) =>
      db.userMenuAccess.upsert({
        where: { userId_menuId: { userId, menuId: m.menuId } },
        update: { canView: m.canView },
        create: { userId, menuId: m.menuId, canView: m.canView },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
