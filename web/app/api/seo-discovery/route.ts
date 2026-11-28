import { NextResponse } from "next/server";
import { apiGet } from "@/lib/api";
import type { AuthUser } from "@/lib/auth/types";
import {
  isSameOriginRequest,
  readSessionAccessToken,
} from "@/lib/auth/session";
import { getDiscoverySnapshot } from "@/lib/seo/discovery-monitor";

async function requireStaff(): Promise<AuthUser | null> {
  const token = await readSessionAccessToken();
  if (!token) return null;

  try {
    const me = await apiGet<AuthUser>(
      "/api/auth/me",
      undefined,
      token,
      { skipStatusRedirect: true },
    );
    if (!me?.isAuthenticated || !me.isStaff) return null;
    return me;
  } catch {
    return null;
  }
}

/** Staff-only snapshot of SEO / llms.txt discovery hits (process-local). */
export async function GET(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const staff = await requireStaff();
    if (!staff) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(getDiscoverySnapshot(), {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    // Never 500 anonymous probes — treat as unauthorized.
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
