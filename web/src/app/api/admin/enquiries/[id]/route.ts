import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/access-control";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  isRead: z.boolean().optional(),
  status: z.enum(["new", "read", "resolved"]).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const enquiryId = parseInt(id, 10);

  if (!enquiryId || isNaN(enquiryId)) {
    return NextResponse.json({ error: "Invalid enquiry ID" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updates = parsed.data;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const existing = await db.contactEnquiry.findUnique({ where: { id: enquiryId }, select: { id: true } });

  if (!existing) {
    return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
  }

  const updated = await db.contactEnquiry.update({
    where: { id: enquiryId },
    data: updates,
    select: {
      id: true,
      isRead: true,
      status: true,
    },
  });

  return NextResponse.json({ success: true, enquiry: updated });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const enquiryId = parseInt(id, 10);

  if (!enquiryId || isNaN(enquiryId)) {
    return NextResponse.json({ error: "Invalid enquiry ID" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  await db.contactEnquiry.update({
    where: { id: enquiryId },
    data: { active: false },
  });

  return NextResponse.json({ success: true });
}
