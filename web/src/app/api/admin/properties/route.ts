import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/access-control";
import { encodePropertyId } from "@/lib/property-id-token";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  listingType: z.enum(["BUY", "RENT"]).optional(),
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

  const { search, city, status, listingType, page, limit } = parsed.data;

  const where = {
    active: true,
    ...(city ? { city: { contains: city } } : {}),
    ...(status ? { status } : {}),
    ...(listingType ? { listingType } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
            { address: { contains: search } },
            { city: { contains: search } },
          ],
        }
      : {}),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const [total, rows] = await Promise.all([
    db.property.count({ where }),
    db.property.findMany({
      where,
      select: {
        id: true,
        title: true,
        city: true,
        price: true,
        status: true,
        listingType: true,
        isFeatured: true,
        createdAt: true,
        type: {
          select: {
            name: true,
            slug: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const items = rows.map((item: { id: number } & Record<string, unknown>) => ({
    ...item,
    publicId: encodePropertyId(item.id),
  }));

  return NextResponse.json({ total, page, limit, items });
}
