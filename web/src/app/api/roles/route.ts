import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const roles = await db.role.findMany({
    where: { active: true },
    orderBy: { roleName: "asc" },
    select: {
      id: true,
      roleName: true,
    },
  });

  return NextResponse.json({ total: roles.length, roles });
}
