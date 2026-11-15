import { MainContent } from "@/components/a11y/MainContent";
import { SiteHeader } from "@/components/landing/SiteHeader";

export function CatalogShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-x-hidden bg-paper">
      <SiteHeader />
      <MainContent className="relative z-10 flex min-w-0 flex-1 flex-col">
        {children}
      </MainContent>
    </div>
  );
}
