import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  search: z.string().optional(),
  roleId: z.coerce.number().int().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
  }

  const { search, roleId, page, limit } = parsed.data;

  const where = {
    ...(roleId ? { roleId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const [total, items] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        roleId: true,
        isInternal: true,
        subscriptionPlan: true,
        subscriptionEndsAt: true,
        leadCredits: true,
        role: {
          select: { id: true, roleName: true, active: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({ total, page, limit, items });
}
