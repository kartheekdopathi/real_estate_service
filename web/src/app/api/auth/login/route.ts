import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authCookie, signAuthToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await db.user.findUnique({
    where: { email },
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
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signAuthToken({ userId: user.id, role: user.role.roleName });

  const response = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.roleName,
    },
  });

  response.cookies.set(authCookie.name, token, authCookie.options);

  return response;
}
