export type DiscoveryKind =
  | "llms.txt"
  | "llms-full.txt"
  | "overview.md"
  | "sitemap.xml"
  | "robots.txt"
  | "book.md"
  | "author.md"
  | "category.md";

export type DiscoveryHit = {
  at: string;
  kind: DiscoveryKind;
  path: string;
  status: number;
  userAgent: string | null;
  referer: string | null;
};

export type DiscoverySnapshot = {
  generatedAt: string;
  processStartedAt: string;
  /** Counters since this Node process started (not durable across restarts). */
  totals: Record<DiscoveryKind, number>;
  totalHits: number;
  recent: DiscoveryHit[];
};

const RECENT_LIMIT = 40;

const processStartedAt = new Date().toISOString();

const totals: Record<DiscoveryKind, number> = {
  "llms.txt": 0,
  "llms-full.txt": 0,
  "overview.md": 0,
  "sitemap.xml": 0,
  "robots.txt": 0,
  "book.md": 0,
  "author.md": 0,
  "category.md": 0,
};

const recent: DiscoveryHit[] = [];

function truncate(value: string | null, max = 180): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

/** Classify public discovery paths (SEO + llms.txt ecosystem). */
export function classifyDiscoveryPath(pathname: string): DiscoveryKind | null {
  const path = pathname.split("?")[0] ?? pathname;
  if (path === "/llms.txt") return "llms.txt";
  if (path === "/llms-full.txt") return "llms-full.txt";
  if (path === "/overview.md") return "overview.md";
  if (path === "/sitemap.xml") return "sitemap.xml";
  if (path === "/robots.txt") return "robots.txt";
  if (/^\/books\/[^/]+\.md$/.test(path) || /^\/_md\/books\/[^/]+$/.test(path)) {
    return "book.md";
  }
  if (
    /^\/authors\/[^/]+\.md$/.test(path) ||
    /^\/_md\/authors\/[^/]+$/.test(path)
  ) {
    return "author.md";
  }
  if (
    /^\/categories\/[^/]+\.md$/.test(path) ||
    /^\/_md\/categories\/[^/]+$/.test(path)
  ) {
    return "category.md";
  }
  return null;
}

export function recordDiscoveryHit(input: {
  kind: DiscoveryKind;
  path: string;
  status?: number;
  userAgent?: string | null;
  referer?: string | null;
}): DiscoveryHit {
  const hit: DiscoveryHit = {
    at: new Date().toISOString(),
    kind: input.kind,
    path: input.path,
    status: input.status ?? 200,
    userAgent: truncate(input.userAgent ?? null),
    referer: truncate(input.referer ?? null),
  };

  totals[hit.kind] += 1;
  recent.unshift(hit);
  if (recent.length > RECENT_LIMIT) {
    recent.length = RECENT_LIMIT;
  }

  // Durable signal for host log drains (Vercel / Docker / reverse proxy).
  console.info(
    JSON.stringify({
      msg: "seo-discovery",
      ...hit,
    }),
  );

  return hit;
}

export function recordDiscoveryFromRequest(
  request: Request,
  kind: DiscoveryKind,
  status = 200,
): DiscoveryHit {
  let path = "/";
  try {
    path = new URL(request.url).pathname;
  } catch {
    path = `/${kind}`;
  }

  return recordDiscoveryHit({
    kind,
    path,
    status,
    userAgent: request.headers.get("user-agent"),
    referer: request.headers.get("referer"),
  });
}

export function getDiscoverySnapshot(): DiscoverySnapshot {
  const totalHits = Object.values(totals).reduce((sum, n) => sum + n, 0);
  return {
    generatedAt: new Date().toISOString(),
    processStartedAt,
    totals: { ...totals },
    totalHits,
    recent: [...recent],
  };
}

/** Test helper — clears in-memory state. */
export function resetDiscoveryMonitorForTests() {
  for (const key of Object.keys(totals) as DiscoveryKind[]) {
    totals[key] = 0;
  }
  recent.length = 0;
}
