import type { NextConfig } from "next";
import { withRedact } from "@tanstack/redact/next";

const isProd = process.env.NODE_ENV === "production";

const apiOrigin = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5200",
    ).origin;
  } catch {
    return "http://localhost:5200";
  }
})();

const connectSrc = isProd
  ? [
      "'self'",
      apiOrigin,
      "https://login.microsoftonline.com",
      "https://*.microsoftonline.com",
      "https://graph.microsoft.com",
      "https://challenges.cloudflare.com",
    ]
  : [
      "'self'",
      apiOrigin,
      "http://127.0.0.1:*",
      "http://localhost:*",
      "https://localhost:*",
      "https://login.microsoftonline.com",
      "https://*.microsoftonline.com",
      "https://graph.microsoft.com",
      "https://challenges.cloudflare.com",
    ];

const scriptSrc = isProd
  ? [
      "'self'",
      "'unsafe-inline'", // Next still needs inline for bootstrapping; no unsafe-eval in prod
      "https://challenges.cloudflare.com",
    ]
  : [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://challenges.cloudflare.com",
    ];

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src ${scriptSrc.join(" ")}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src ${connectSrc.join(" ")}`,
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "object-src 'none'",
      "frame-src 'self' https://login.microsoftonline.com https://www.openstreetmap.org https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      ...(isProd ? ["upgrade-insecure-requests"] : []),
    ].join("; "),
  },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  compress: true,
  compiler: {
    styledComponents: true,
  },
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "@react-three/drei",

      "@react-three/fiber",
      "@tanstack/react-pacer",
      "@tanstack/react-virtual",
      "@tanstack/charts",
      "react-admin",
      "@mui/material",
      "@mui/icons-material",
      "styled-components",
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/books/:id.md",
        destination: "/_md/books/:id",
      },
      {
        source: "/authors/:id.md",
        destination: "/_md/authors/:id",
      },
      {
        source: "/categories/:id.md",
        destination: "/_md/categories/:id",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          // llmstxt.org v2 — help agents discover the site overview
          {
            key: "Link",
            value: '</llms.txt>; rel="describedby"',
          },
        ],
      },
      {
        source: "/",
        headers: [
          {
            key: "Link",
            value:
              '</overview.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"',
          },
        ],
      },
    ];
  },
};

export default withRedact(nextConfig);
