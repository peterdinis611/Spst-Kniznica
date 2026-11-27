import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8_192;
let lastLogAt = 0;

/**
 * Browser CSP violation reports (report-uri / Reporting-Endpoints).
 * Intentionally fire-and-forget — never block page loads.
 */
export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 204 });
  }

  let raw = "";
  try {
    raw = (await request.text()).slice(0, MAX_BODY_BYTES);
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const now = Date.now();
  // Soft rate limit noisy Report-Only floods in logs.
  if (now - lastLogAt > 2_000 && raw) {
    lastLogAt = now;
    console.warn("[csp-report]", raw.slice(0, 1_500));
  }

  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  return NextResponse.json({ ok: true, sink: "csp-report" });
}
