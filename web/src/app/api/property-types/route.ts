import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const types = await db.propertyType.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  return NextResponse.json({ total: types.length, types });
}
