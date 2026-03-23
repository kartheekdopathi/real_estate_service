import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  try {
    const result = await db.property.groupBy({
      by: ["city"],
      where: { active: true, status: "PUBLISHED" },
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
    });

    const cities = (result as { city: string; _count: { city: number } }[]).map((r) => ({
      name: r.city,
      count: r._count.city,
    }));

    return NextResponse.json({ cities });
  } catch {
    return NextResponse.json({ cities: [] });
  }
}
