import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "res_token";

function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET ?? "fallback-secret-change-me";
  return new TextEncoder().encode(secret);
}

type TokenPayload = { userId: string | number; role: string };

async function getTokenPayload(request: NextRequest): Promise<TokenPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const p = payload as TokenPayload;

    if (!p.userId || !p.role) return null;

    return p;
  } catch {
    return null;
  }
}

const roleDashboard: Record<string, string> = {
  ADMIN: "/admin",
  AGENT: "/agent",
  BUYER: "/dashboard",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const payload = await getTokenPayload(request);

  // Already logged in → bounce away from auth pages
  if (pathname === "/login" || pathname === "/signup") {
    if (payload) {
      const dest = roleDashboard[payload.role] ?? "/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }

    return NextResponse.next();
  }

  // Admin routes — require ADMIN role
  if (pathname.startsWith("/admin")) {
    if (!payload) {
      return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));
    }

    if (payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL(roleDashboard[payload.role] ?? "/", request.url));
    }

    return NextResponse.next();
  }

  // Agent dashboard — require AGENT (or ADMIN)
  if (pathname.startsWith("/agent")) {
    if (!payload) {
      return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));
    }

    if (payload.role !== "AGENT" && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL(roleDashboard[payload.role] ?? "/", request.url));
    }

    return NextResponse.next();
  }

  // Buyer dashboard — require any authenticated user
  if (pathname.startsWith("/dashboard")) {
    if (!payload) {
      return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));
    }

    // Agents and admins redirect to their own dashboards
    if (payload.role !== "BUYER") {
      return NextResponse.redirect(new URL(roleDashboard[payload.role] ?? "/", request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/agent/:path*", "/dashboard/:path*", "/login", "/signup"],
};
