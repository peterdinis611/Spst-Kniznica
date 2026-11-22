import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { absoluteUrl } from "@/lib/site";
import { recordDiscoveryHit } from "@/lib/seo/discovery-monitor";

const PRIVATE_PATHS = [
  "/admin",
  "/admin/",
  "/login",
  "/library",
  "/desk",
  "/bookings",
  "/api/",
  "/_md/",
  "/401",
  "/404",
  "/500",
  "/502",
  "/503",
] as const;

const PUBLIC_AI = [
  "/",
  "/llms.txt",
  "/llms-full.txt",
  "/overview.md",
  "/sitemap.xml",
] as const;

export default async function robots(): Promise<MetadataRoute.Robots> {
  try {
    const h = await headers();
    recordDiscoveryHit({
      kind: "robots.txt",
      path: "/robots.txt",
      userAgent: h.get("user-agent"),
      referer: h.get("referer"),
    });
  } catch {
    /* headers() unavailable outside request context */
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: [...PUBLIC_AI],
        disallow: [...PRIVATE_PATHS],
      },
      // AI crawlers: same public surface; private staff/user paths stay closed.
      {
        userAgent: "GPTBot",
        allow: [...PUBLIC_AI],
        disallow: [...PRIVATE_PATHS],
      },
      {
        userAgent: "ChatGPT-User",
        allow: [...PUBLIC_AI],
        disallow: [...PRIVATE_PATHS],
      },
      {
        userAgent: "ClaudeBot",
        allow: [...PUBLIC_AI],
        disallow: [...PRIVATE_PATHS],
      },
      {
        userAgent: "Anthropic-AI",
        allow: [...PUBLIC_AI],
        disallow: [...PRIVATE_PATHS],
      },
      {
        userAgent: "PerplexityBot",
        allow: [...PUBLIC_AI],
        disallow: [...PRIVATE_PATHS],
      },
      {
        userAgent: "Google-Extended",
        allow: [...PUBLIC_AI],
        disallow: [...PRIVATE_PATHS],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/").replace(/\/$/, ""),
  };
}
