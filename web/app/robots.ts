import type { MetadataRoute } from "next";
import { absoluteUrl, isDevelopmentStage } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (isDevelopmentStage) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      host: absoluteUrl("/"),
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/admin"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
