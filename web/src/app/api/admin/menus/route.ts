import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  search: z.string().optional(),
  active: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

const createSchema = z.object({
  key: z.string().min(2).max(80),
  title: z.string().min(2).max(80),
  path: z.string().min(1).max(160),
  icon: z.string().max(80).optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
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

  const { search, active, page, limit } = parsed.data;

  const where = {
    ...(typeof active === "string" ? { active: active === "true" } : {}),
    ...(search
      ? {
          OR: [
            { key: { contains: search } },
            { title: { contains: search } },
            { path: { contains: search } },
          ],
        }
      : {}),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const [total, items] = await Promise.all([
    db.menu.count({ where }),
    db.menu.findMany({
      where,
      include: {
        parent: {
          select: { id: true, key: true, title: true },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({ total, page, limit, items });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const created = await db.menu.create({
    data: {
      key: parsed.data.key,
      title: parsed.data.title,
      path: parsed.data.path,
      icon: parsed.data.icon,
      parentId: parsed.data.parentId,
      sortOrder: parsed.data.sortOrder ?? 0,
      active: parsed.data.active ?? true,
    },
  });

  return NextResponse.json({ menu: created }, { status: 201 });
}
