import { NextRequest } from "next/server";

import { authCookie, verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getAuthUser(request: NextRequest) {
  const token = request.cookies.get(authCookie.name)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyAuthToken(token);

  if (!payload) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    include: {
      role: {
        select: {
          id: true,
          roleName: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.roleName,
    isInternal: Boolean(user.isInternal),
    leadCredits: user.leadCredits,
    subscriptionPlan: user.subscriptionPlan,
  };
}
