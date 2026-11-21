import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

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

export default function robots(): MetadataRoute.Robots {
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
