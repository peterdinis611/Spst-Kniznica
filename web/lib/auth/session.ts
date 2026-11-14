import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session-constants";

export {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session-constants";

export function sessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function readSessionAccessToken(): Promise<string | null> {
  try {
    const jar = await cookies();
    const value = jar.get(SESSION_COOKIE)?.value?.trim();
    return value || null;
  } catch {
    return null;
  }
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }
  try {
    const host = request.headers.get("host");
    if (!host) return false;
    const url = new URL(origin);
    return url.host === host;
  } catch {
    return false;
  }
}
