import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session-constants";

const PROTECTED_PREFIXES = ["/admin", "/bookings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsAuth = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!needsAuth) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (hasSession) {
    return NextResponse.next();
  }

  const unauthorized = new URL("/401", request.url);
  unauthorized.searchParams.set("next", pathname);
  return NextResponse.redirect(unauthorized);
}

export const config = {
  matcher: ["/admin/:path*", "/bookings/:path*"],
};
