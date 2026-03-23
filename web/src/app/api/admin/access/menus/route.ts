import { NextRequest, NextResponse } from "next/server";

import { getUserMenus } from "@/lib/access-control";
import { getAuthUser } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const menus = await getUserMenus(user.id);

  return NextResponse.json({ total: menus.length, menus });
}
