import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  resource: z.string().optional(),
  action: z.enum(["VIEW", "CREATE", "EDIT", "DELETE"]).optional(),
  active: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
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

  const { resource, action, active, page, limit } = parsed.data;

  const where = {
    ...(resource ? { resource } : {}),
    ...(action ? { action } : {}),
    ...(typeof active === "string" ? { active: active === "true" } : {}),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const [total, items] = await Promise.all([
    db.permission.count({ where }),
    db.permission.findMany({
      where,
      orderBy: [{ resource: "asc" }, { action: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({ total, page, limit, items });
}
