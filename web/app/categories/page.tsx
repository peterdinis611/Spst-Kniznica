import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";

export const metadata = {
  title: "Kategórie",
};

export default function CategoriesPage() {
  return (
    <main className="relative flex min-h-full flex-1 flex-col bg-paper">
      <SiteHeader />
      <div className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-4 md:px-8">
        <p className="text-xs tracking-[0.2em] text-accent uppercase">Katalóg</p>
        <h1 className="mt-3 font-display text-5xl text-ink">Kategórie</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Stub pre CategoryService cez Gateway (`/api/categories`).
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
