import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session-constants";
import {
  isSameOriginRequest,
  sessionCookieOptions,
} from "@/lib/auth/session";

export async function GET() {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const hasSession = Boolean(jar.get(SESSION_COOKIE)?.value);
  return NextResponse.json({ authenticated: hasSession });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  let body: { accessToken?: string };
  try {
    body = (await request.json()) as { accessToken?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = body.accessToken?.trim();
  if (!token) {
    return NextResponse.json({ error: "accessToken required" }, { status: 400 });
  }

  // Cookie size guard (~3.5KB) — oversized AT should not be stored in cookie
  if (token.length > 3500) {
    return NextResponse.json(
      { error: "Token too large for session cookie" },
      { status: 413 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(0),
    maxAge: 0,
  });
  return response;
}
