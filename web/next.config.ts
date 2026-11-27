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

// Enforce keeps 'unsafe-inline' while cacheComponents/partial prefetch are on —
// nonce CSP would force dynamic rendering. Report-Only (below) tracks violations
// so we can switch to nonces once that tradeoff is accepted.
const scriptSrc = isProd
  ? [
      "'self'",
      "'unsafe-inline'",
      "https://challenges.cloudflare.com",
    ]
  : [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://challenges.cloudflare.com",
    ];

/** Stricter observe-only policy — collects what would break without 'unsafe-inline'. */
const scriptSrcReportOnly = isProd
  ? ["'self'", "https://challenges.cloudflare.com"]
  : ["'self'", "'unsafe-eval'", "https://challenges.cloudflare.com"];

const cspDirectives = (scripts: string[]) =>
  [
    "default-src 'self'",
    `script-src ${scripts.join(" ")}`,
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
    "report-uri /api/csp-report",
    "report-to csp-endpoint",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

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
    key: "Reporting-Endpoints",
    value: 'csp-endpoint="/api/csp-report")',
  },
  {
    key: "Content-Security-Policy",
    value: cspDirectives(scriptSrc),
  },
  {
    key: "Content-Security-Policy-Report-Only",
    value: cspDirectives(scriptSrcReportOnly),
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
