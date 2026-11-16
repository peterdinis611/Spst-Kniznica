import type { Metadata } from "next";
import { Suspense } from "react";
import { MainContent } from "@/components/a11y/MainContent";
import { LandingContent } from "@/components/landing/LandingContent";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { RouteLoading } from "@/components/routing/RouteLoading";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: siteConfig.name,
    description: siteConfig.description,
    path: "/",
  }),
  title: {
    absolute: siteConfig.name,
  },
};

export default function HomePage() {
  return (
    <div className="relative flex min-h-full min-w-0 flex-1 flex-col overflow-x-clip bg-paper">
      <SiteHeader />

      <MainContent className="relative z-10 flex w-full min-w-0 flex-1 flex-col">
        <Suspense fallback={<RouteLoading variant="landing" />}>
          <LandingContent />
        </Suspense>
      </MainContent>

      <Suspense
        fallback={
          <footer className="mt-auto border-t border-rule px-5 py-10 text-muted-foreground">
            <p className="mx-auto max-w-6xl text-xs">SPST Knižnica.</p>
          </footer>
        }
      >
        <SiteFooter />
      </Suspense>
    </div>
  );
}
