import { NextResponse } from "next/server";
import { isBffAllowedPath } from "@/lib/api/bff-allowlist";
import {
  catalogResponseCacheControl,
  isPublicCatalogGet,
} from "@/lib/api/catalog-cache";
import { SESSION_COOKIE } from "@/lib/auth/session-constants";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5200"
).replace(/\/$/, "");

const UPSTREAM_TIMEOUT_MS = 25_000;
const MAX_BODY_BYTES = 2 * 1024 * 1024;

async function proxy(request: Request, pathParts: string[]) {
  const path = pathParts.join("/");
  if (!isBffAllowedPath(path)) {
    return NextResponse.json(
      {
        title: "Forbidden",
        detail: "Táto cesta nie je povolená cez BFF.",
        status: 403,
      },
      { status: 403 },
    );
  }

  const incoming = new URL(request.url);
  const target = `${API_BASE}/${path}${incoming.search}`;

  const headers = new Headers();
  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  // Prefer explicit Authorization (login bootstrap); else HttpOnly session cookie.
  const incomingAuth = request.headers.get("authorization");
  if (incomingAuth) {
    headers.set("Authorization", incomingAuth);
  } else {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
    const token = match?.slice(SESSION_COOKIE.length + 1);
    if (token) {
      headers.set("Authorization", `Bearer ${decodeURIComponent(token)}`);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
    signal: controller.signal,
    duplex: "half",
  } as RequestInit;

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) {
      clearTimeout(timer);
      return NextResponse.json(
        {
          title: "Payload Too Large",
          detail: "Request body exceeds BFF limit.",
          status: 413,
        },
        { status: 413 },
      );
    }
    init.body = body;
  }

  try {
    const upstream = await fetch(target, init);
    const body = await upstream.arrayBuffer();
    const responseHeaders = new Headers();
    const upstreamType = upstream.headers.get("content-type");
    if (upstreamType) responseHeaders.set("content-type", upstreamType);
    const retryAfter = upstream.headers.get("retry-after");
    if (retryAfter) responseHeaders.set("retry-after", retryAfter);
    const disposition = upstream.headers.get("content-disposition");
    if (disposition) responseHeaders.set("content-disposition", disposition);
    const cacheControl = upstream.headers.get("cache-control");
    if (cacheControl) {
      responseHeaders.set("cache-control", cacheControl);
    } else if (upstream.ok && isPublicCatalogGet(path, request.method)) {
      const fallback = catalogResponseCacheControl(path);
      if (fallback) responseHeaders.set("cache-control", fallback);
    }
    const pragma = upstream.headers.get("pragma");
    if (pragma) responseHeaders.set("pragma", pragma);
    const nosniff = upstream.headers.get("x-content-type-options");
    if (nosniff) responseHeaders.set("x-content-type-options", nosniff);

    return new NextResponse(body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      {
        title: "Zlá brána",
        detail: "Upstream API je nedostupné.",
        status: 502,
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timer);
  }
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}
