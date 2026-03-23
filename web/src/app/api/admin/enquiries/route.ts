import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  status: z.enum(["all", "new", "read", "resolved"]).default("all"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { status, page, limit, search } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const where: Record<string, unknown> = { active: true };

  if (status !== "all") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { subject: { contains: search } },
      { message: { contains: search } },
    ];
  }

  const [total, unreadCount, items] = await Promise.all([
    db.contactEnquiry.count({ where }),
    db.contactEnquiry.count({ where: { active: true, isRead: false } }),
    db.contactEnquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        subject: true,
        message: true,
        isRead: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({ total, unreadCount, page, limit, items });
}
