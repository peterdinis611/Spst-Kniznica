import { Suspense } from "react";
import { LandingContent } from "@/components/landing/LandingContent";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";

export default function HomePage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col overflow-x-hidden bg-paper">
      <SiteHeader />

      <Suspense
        fallback={
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-2 md:px-8">
            <div className="h-64 animate-pulse bg-paper-deep" />
            <div className="h-64 animate-pulse bg-paper-deep" />
          </div>
        }
      >
        <LandingContent />
      </Suspense>

      <Suspense
        fallback={
          <footer className="mt-auto border-t border-rule px-5 py-10 text-muted-foreground">
            <p className="mx-auto max-w-6xl text-xs lowercase">spst knižnica.</p>
          </footer>
        }
      >
        <SiteFooter />
      </Suspense>
    </main>
  );
}
