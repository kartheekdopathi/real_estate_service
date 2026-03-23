import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthUser } from "@/lib/server-auth";
import { encodePropertyId } from "@/lib/property-id-token";
import { prisma } from "@/lib/prisma";

const createPropertySchema = z.object({
  typeSlug: z.string().min(2),
  listingType: z.enum(["BUY", "RENT"]),
  title: z.string().min(3).max(140),
  description: z.string().min(20).max(5000),
  price: z.coerce.number().positive(),
  city: z.string().min(2).max(80),
  address: z.string().min(3).max(180),
  latitude: z.coerce.number().gte(-90).lte(90).optional(),
  longitude: z.coerce.number().gte(-180).lte(180).optional(),
  beds: z.coerce.number().int().min(0),
  baths: z.coerce.number().int().min(0),
  areaSqft: z.coerce.number().int().positive(),
  contactPhone: z.string().max(30).optional(),
  contactWhatsApp: z.string().max(30).optional(),
  contactEmail: z.string().email().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

const listQuerySchema = z.object({
  q: z.string().optional(),
  searchMode: z.enum(["keyword", "semantic"]).optional(),
  featured: z.enum(["true", "false"]).optional(),
  city: z.string().optional(),
  listingType: z.enum(["BUY", "RENT"]).optional(),
  type: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  beds: z.coerce.number().int().min(0).optional(),
  baths: z.coerce.number().int().min(0).optional(),
  mine: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

const TOKEN_EXPANSION: Record<string, string[]> = {
  buy: ["sale", "purchase", "own"],
  sale: ["buy", "purchase", "own"],
  rent: ["lease", "rental", "tenant"],
  lease: ["rent", "rental", "tenant"],
  apartment: ["flat", "unit"],
  flat: ["apartment", "unit"],
  villa: ["house", "home"],
  house: ["home", "villa"],
  office: ["workspace", "commercial"],
  shop: ["store", "retail"],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function expandedTokens(query: string): string[] {
  const unique = new Set<string>();
  for (const token of tokenize(query)) {
    unique.add(token);
    for (const alt of TOKEN_EXPANSION[token] ?? []) {
      unique.add(alt);
    }
  }
  return Array.from(unique);
}

function semanticScore(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any,
  rawQuery: string,
): number {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return 0;

  const title = String(item.title ?? "").toLowerCase();
  const description = String(item.description ?? "").toLowerCase();
  const city = String(item.city ?? "").toLowerCase();
  const address = String(item.address ?? "").toLowerCase();
  const typeName = String(item.type?.name ?? "").toLowerCase();
  const listingType = String(item.listingType ?? "").toLowerCase();

  let score = 0;

  if (title.includes(query)) score += 12;
  if (description.includes(query)) score += 6;
  if (city.includes(query)) score += 4;
  if (address.includes(query)) score += 4;
  if (typeName.includes(query)) score += 5;

  for (const token of expandedTokens(query)) {
    if (title.includes(token)) score += 3;
    if (typeName.includes(token)) score += 2;
    if (description.includes(token)) score += 1.5;
    if (city.includes(token)) score += 1.5;
    if (address.includes(token)) score += 1.5;
    if (listingType.includes(token)) score += 1.5;

    if (/^\d+$/.test(token)) {
      const n = Number(token);
      if (Number.isFinite(n)) {
        if (n > 0 && Number(item.beds ?? -1) === n) score += 1.5;
        if (n > 0 && Number(item.baths ?? -1) === n) score += 1.5;
        if (n > 0 && Number(item.areaSqft ?? -1) === n) score += 1;
      }
    }
  }

  return score;
}

export async function GET(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;
  const user = await getAuthUser(request);

  const parsed = listQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", details: parsed.error.flatten() }, { status: 400 });
  }

  const { q, searchMode, featured, city, listingType, type, minPrice, maxPrice, beds, baths, mine, page, limit } = parsed.data;
  const query = q?.trim() ?? "";
  const hasValidSearchQuery = query.length >= 3;
  const useSemanticMode = searchMode === "semantic" && hasValidSearchQuery;

  const mineOnly = mine === "true";
  if (mineOnly && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const mineUserId = mineOnly ? user?.id : undefined;

  const whereBase = {
    active: true,
    ...(mineOnly ? { agentId: mineUserId } : { status: "PUBLISHED" }),
    ...(featured === "true" ? { isFeatured: true } : {}),
    ...(city ? { city: { contains: city } } : {}),
    ...(listingType ? { listingType } : {}),
    ...(type ? { type: { slug: type } } : {}),
    ...(beds !== undefined ? { beds: { gte: beds } } : {}),
    ...(baths !== undefined ? { baths: { gte: baths } } : {}),
    ...(minPrice || maxPrice
      ? {
          price: {
            ...(minPrice ? { gte: minPrice } : {}),
            ...(maxPrice ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  const keywordWhere = {
    ...whereBase,
    ...(hasValidSearchQuery
      ? {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
            { city: { contains: query } },
            { address: { contains: query } },
          ],
        }
      : {}),
  };

  if (useSemanticMode) {
    const semanticCandidates = await db.property.findMany({
      where: whereBase,
      include: {
        type: { select: { id: true, name: true, slug: true } },
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
        },
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            contactReveals: true,
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 300,
    });

    const scored = semanticCandidates
      .map((item: Record<string, unknown>) => ({
        ...item,
        _semanticScore: semanticScore(item, query),
      }))
      .filter((item: { _semanticScore: number }) => item._semanticScore > 0)
      .sort((a: { _semanticScore: number; isFeatured?: boolean; createdAt?: Date }, b: { _semanticScore: number; isFeatured?: boolean; createdAt?: Date }) => {
        if (b._semanticScore !== a._semanticScore) {
          return b._semanticScore - a._semanticScore;
        }

        const aFeatured = a.isFeatured ? 1 : 0;
        const bFeatured = b.isFeatured ? 1 : 0;
        if (bFeatured !== aFeatured) {
          return bFeatured - aFeatured;
        }

        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

    const total = scored.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const items = scored.slice(start, end);

    const itemsWithPublicId = items.map((item: { id: number } & Record<string, unknown>) => ({
      ...item,
      publicId: encodePropertyId(item.id),
    }));

    return NextResponse.json({
      total,
      page,
      limit,
      searchMode: "semantic",
      items: itemsWithPublicId,
    });
  }

  const [total, items] = await Promise.all([
    db.property.count({ where: keywordWhere }),
    db.property.findMany({
      where: keywordWhere,
      include: {
        type: { select: { id: true, name: true, slug: true } },
        images: {
          take: 1,
          orderBy: { sortOrder: "asc" },
        },
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            contactReveals: true,
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const itemsWithPublicId = items.map((item: { id: number } & Record<string, unknown>) => ({
    ...item,
    publicId: encodePropertyId(item.id),
  }));

  return NextResponse.json({
    total,
    page,
    limit,
    searchMode: "keyword",
    minQueryLength: 3,
    items: itemsWithPublicId,
  });
}

export async function POST(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  try {
    const user = await getAuthUser(request);

    if (!user || (user.role !== "AGENT" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createPropertySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
    }

    const payload = parsed.data;

    const propertyType = await db.propertyType.findFirst({ where: { slug: payload.typeSlug, active: true } });

    if (!propertyType) {
      return NextResponse.json({ error: "Invalid property type" }, { status: 400 });
    }

    const baseData = {
      agentId: user.id,
      typeId: propertyType.id,
      listingType: payload.listingType,
      title: payload.title,
      description: payload.description,
      price: payload.price,
      city: payload.city,
      address: payload.address,
      contactPhone: payload.contactPhone,
      contactWhatsApp: payload.contactWhatsApp,
      contactEmail: payload.contactEmail,
      latitude: payload.latitude,
      longitude: payload.longitude,
      beds: payload.beds,
      baths: payload.baths,
      areaSqft: payload.areaSqft,
      status: payload.status ?? "DRAFT",
    };

    let created;
    try {
      created = await db.property.create({
        data: {
          ...baseData,
          metadataRaw: payload.metadata ? JSON.stringify(payload.metadata) : null,
        },
        include: {
          type: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
        },
      });
    } catch (createErr) {
      const msg = String((createErr as { message?: string })?.message ?? "");
      const schemaMismatch =
        msg.includes("metadataRaw") ||
        msg.includes("Unknown argument") ||
        msg.includes("Unknown column") ||
        msg.includes("P2022");

      if (!schemaMismatch) {
        throw createErr;
      }

      created = await db.property.create({
        data: baseData,
        include: {
          type: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
        },
      });
    }

    return NextResponse.json(
      {
        property: {
          ...created,
          publicId: encodePropertyId(created.id),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = String((error as { message?: string })?.message ?? "Internal error");
    return NextResponse.json(
      {
        error: "Unable to create property",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}
