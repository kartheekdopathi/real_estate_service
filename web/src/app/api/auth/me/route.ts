import { NextRequest, NextResponse } from "next/server";

import { getAuthUser } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json(
      { user: null },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" } },
    );
  }

  return NextResponse.json(
    { user },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" } },
  );
}
