"use client";

import dynamic from "next/dynamic";

export const ScrollToTopLazy = dynamic(
  () => import("@/components/scroll-to-top").then((mod) => mod.ScrollToTop),
  { ssr: false },
);
