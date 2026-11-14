import type { NextConfig } from "next";

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
    ]
  : [
      "'self'",
      apiOrigin,
      "http://localhost:*",
      "https://localhost:*",
      "https://login.microsoftonline.com",
      "https://*.microsoftonline.com",
      "https://graph.microsoft.com",
    ];

const scriptSrc = isProd
  ? ["'self'", "'unsafe-inline'"] // Next still needs inline for bootstrapping; no unsafe-eval in prod
  : ["'self'", "'unsafe-inline'", "'unsafe-eval'"];

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
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
      "frame-src 'self' https://login.microsoftonline.com",
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
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@react-three/drei",
      "@react-three/fiber",
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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
