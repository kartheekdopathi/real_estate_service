import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { authCookie, hashPassword, signAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  phone: z.string().max(20).optional(),
  role: z.enum(["BUYER", "AGENT"]).default("BUYER"),
});

export async function POST(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, password, phone, role } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  // Get active role from master table
  const roleRecord = await db.role.findFirst({ where: { roleName: role, active: true } });

  if (!roleRecord) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  const user = await db.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      roleId: roleRecord.id,
      ...(role === "AGENT"
        ? {
            agentProfile: {
              create: {},
            },
          }
        : {}),
    },
    include: {
      role: {
        select: {
          id: true,
          roleName: true,
        },
      },
    },
  });

  const token = await signAuthToken({ userId: user.id, role: user.role.roleName });

  const response = NextResponse.json(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.roleName,
        phone: user.phone,
      },
    },
    { status: 201 }
  );
  response.cookies.set(authCookie.name, token, authCookie.options);

  return response;
}
