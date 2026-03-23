import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().max(20).nullable().optional(),
  roleId: z.coerce.number().int().optional(),
  isInternal: z.boolean().optional(),
  subscriptionPlan: z.enum(["FREE", "PRO", "PREMIUM"]).optional(),
  subscriptionDays: z.coerce.number().int().positive().max(365).optional(),
  leadCredits: z.coerce.number().int().min(0).optional(),
  leadCreditsDelta: z.coerce.number().int().optional(),
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

  const user = await db.user.findUnique({
    where: { id },
    include: {
      role: true,
      userPermissions: {
        include: {
          permission: true,
        },
      },
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

  return NextResponse.json({ user });
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

  const updated = await db.user.update({
    where: { id },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
      ...(parsed.data.roleId ? { roleId: parsed.data.roleId } : {}),
      ...(parsed.data.isInternal !== undefined ? { isInternal: parsed.data.isInternal } : {}),
      ...(parsed.data.subscriptionPlan ? { subscriptionPlan: parsed.data.subscriptionPlan } : {}),
      ...(parsed.data.subscriptionPlan
        ? {
            subscriptionEndsAt:
              parsed.data.subscriptionPlan === "FREE"
                ? null
                : new Date(Date.now() + (parsed.data.subscriptionDays ?? 30) * 24 * 60 * 60 * 1000),
          }
        : {}),
      ...(parsed.data.leadCredits !== undefined ? { leadCredits: parsed.data.leadCredits } : {}),
      ...(parsed.data.leadCreditsDelta
        ? {
            leadCredits:
              parsed.data.leadCreditsDelta > 0
                ? { increment: parsed.data.leadCreditsDelta }
                : { decrement: Math.abs(parsed.data.leadCreditsDelta) },
          }
        : {}),
    },
    include: {
      role: {
        select: {
          id: true,
          roleName: true,
        },
      },
    },
  });

  return NextResponse.json({ user: updated });
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

  await db.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
