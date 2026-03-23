import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(20).optional().nullable(),
  subject: z.string().min(1, "Please select a subject").max(100),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.flatten().fieldErrors
        ? Object.values(parsed.error.flatten().fieldErrors).flat()[0]
        : "Invalid input";
      return NextResponse.json({ error: firstError ?? "Invalid input" }, { status: 400 });
    }

    const { name, email, phone, subject, message } = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any;

    const enquiry = await db.contactEnquiry.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() ?? null,
        subject,
        message: message.trim(),
        status: "new",
        isRead: false,
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, id: enquiry.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/contact]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
