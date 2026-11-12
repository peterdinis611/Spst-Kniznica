import type { Metadata } from "next";
import { Suspense } from "react";
import { LandingContent } from "@/components/landing/LandingContent";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { RouteLoading } from "@/components/routing/RouteLoading";
import { siteConfig } from "@/lib/site";


export const metadata: Metadata = {
  title: {
    absolute: siteConfig.name,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: "/",
  },
};

export default function HomePage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col overflow-x-hidden bg-paper">
      <SiteHeader />

      <Suspense fallback={<RouteLoading variant="landing" />}>
        <LandingContent />
      </Suspense>

      <Suspense
        fallback={
          <footer className="mt-auto border-t border-rule px-5 py-10 text-muted-foreground">
            <p className="mx-auto max-w-6xl text-xs">SPST Knižnica.</p>
          </footer>
        }
      >
        <SiteFooter />
      </Suspense>
    </main>
  );
}
