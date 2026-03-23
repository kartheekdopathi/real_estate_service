import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/server-auth";

const bodySchema = z.object({
  package: z.enum(["PRO_MONTHLY", "PREMIUM_MONTHLY", "LEAD_PACK_10"]),
});

export async function POST(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const user = await getAuthUser(request);
  if (!user || (user.role !== "AGENT" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const pkg = parsed.data.package;
  const now = new Date();
  const plus30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const updated = await db.user.update({
    where: { id: user.id },
    data:
      pkg === "LEAD_PACK_10"
        ? { leadCredits: { increment: 10 } }
        : pkg === "PRO_MONTHLY"
          ? {
              subscriptionPlan: "PRO",
              subscriptionEndsAt: plus30,
              leadCredits: { increment: 15 },
            }
          : {
              subscriptionPlan: "PREMIUM",
              subscriptionEndsAt: plus30,
              leadCredits: { increment: 40 },
            },
    select: {
      id: true,
      role: { select: { roleName: true } },
      subscriptionPlan: true,
      subscriptionEndsAt: true,
      leadCredits: true,
    },
  });

  return NextResponse.json({
    ok: true,
    mode: "demo",
    user: updated,
  });
}
