import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { haversineDistanceKm } from "@/lib/geo";
import { encodePropertyId } from "@/lib/property-id-token";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  lat: z.coerce.number().gte(-90).lte(90),
  lng: z.coerce.number().gte(-180).lte(180),
  radiusKm: z.coerce.number().positive().max(100).default(10),
  q: z.string().trim().min(3).optional(),
  featured: z.enum(["true", "false"]).optional(),
  city: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional(),
  listingType: z.enum(["BUY", "RENT"]).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  beds: z.coerce.number().int().positive().optional(),
  baths: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { lat, lng, radiusKm, q, featured, city, type, listingType, minPrice, maxPrice, beds, baths, limit } = parsed.data;

  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));

  type PropertyFindManyArgs = NonNullable<Parameters<typeof prisma.property.findMany>[0]>;

  const where: PropertyFindManyArgs["where"] = {
    active: true,
    status: "PUBLISHED",
    listingType,
    ...(featured === "true" ? { isFeatured: true } : {}),
    ...(city ? { city: { contains: city } } : {}),
    ...(type ? { type: { slug: type } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { city: { contains: q } },
            { address: { contains: q } },
          ],
        }
      : {}),
    latitude: {
      gte: lat - latDelta,
      lte: lat + latDelta,
    },
    longitude: {
      gte: lng - lngDelta,
      lte: lng + lngDelta,
    },
    ...(beds ? { beds: { gte: beds } } : {}),
    ...(baths ? { baths: { gte: baths } } : {}),
    ...(minPrice || maxPrice
      ? {
          price: {
            ...(minPrice ? { gte: minPrice } : {}),
            ...(maxPrice ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  const candidates = await prisma.property.findMany({
    where,
    include: {
      type: {
        select: {
          name: true,
          slug: true,
        },
      },
      images: {
        take: 1,
        orderBy: {
          sortOrder: "asc",
        },
      },
      agent: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    take: Math.min(limit * 3, 300),
  });

  const results = candidates
    .flatMap((property: (typeof candidates)[number]) => {
      const propLat = property.latitude ? Number(property.latitude) : null;
      const propLng = property.longitude ? Number(property.longitude) : null;

      if (propLat === null || propLng === null) {
        return [];
      }

      const distanceKm = haversineDistanceKm(lat, lng, propLat, propLng);

      if (distanceKm > radiusKm) {
        return [];
      }

      return [
        {
          id: property.id,
          publicId: encodePropertyId(property.id),
          title: property.title,
          isFeatured: property.isFeatured,
          listingType: property.listingType,
          city: property.city,
          address: property.address,
          price: property.price,
          beds: property.beds,
          baths: property.baths,
          areaSqft: property.areaSqft,
          type: property.type,
          latitude: propLat,
          longitude: propLng,
          distanceKm: Number(distanceKm.toFixed(2)),
          thumbnail: property.images[0]?.url ?? null,
          agent: property.agent,
        },
      ];
    })
    .sort((a: { distanceKm: number }, b: { distanceKm: number }) => a.distanceKm - b.distanceKm)
    .slice(0, limit);

  return NextResponse.json({
    total: results.length,
    filters: {
      lat,
      lng,
      radiusKm,
      q: q ?? null,
      featured: featured ?? null,
      city: city ?? null,
      type: type ?? null,
      listingType: listingType ?? null,
      minPrice: minPrice ?? null,
      maxPrice: maxPrice ?? null,
      beds: beds ?? null,
      baths: baths ?? null,
    },
    results,
  });
}
