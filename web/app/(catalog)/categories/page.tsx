import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FlatCover } from "@/components/landing/FlatCover";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import { getCategoryBooks, MOCK_CATEGORIES } from "@/lib/catalog-mock";

export const metadata = {
  title: "Kategórie",
};

export default function CategoriesPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <CatalogTopBar
        title="Žánre a rady"
        lead="Vyber kategóriu — žltý panel ukáže vzorku kníh a skok do filtrovaného fondu."
        showSearch={false}
      />

      <div className="mt-6 flex items-end justify-between gap-4 border-b border-rule pb-3">
        <p className="text-sm text-muted-foreground">Register kategórií</p>
        <p className="font-display text-xl text-ink">{MOCK_CATEGORIES.length}</p>
      </div>

      <ul className="space-y-10 pb-16 pt-8">
        {MOCK_CATEGORIES.map((category, index) => {
          const samples = getCategoryBooks(category.id).slice(0, 3);
          return (
            <li
              key={category.id}
              className="grid gap-6 border border-rule p-4 transition hover:border-ink sm:p-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
            >
              <div className="flex flex-col">
                <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-2 font-display text-[clamp(2rem,5vw,3.2rem)] leading-none text-ink">
                  {category.name}
                </h2>
                <p className="mt-3 max-w-md text-sm text-muted-foreground">
                  {category.description}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="bg-accent px-3 py-1.5 font-display text-2xl text-ink">
                    {category.bookCount}
                  </span>
                  <span className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
                    titulov vo fonde
                  </span>
                </div>
                <Link
                  href={`/books?category=${category.id}`}
                  className="split-cta group mt-8 w-fit border border-ink bg-paper"
                >
                  <span className="px-4 py-2.5 text-sm font-semibold">
                    Zobraziť knihy
                  </span>
                  <span className="flex items-center bg-ink px-3 text-paper transition group-hover:bg-accent group-hover:text-ink">
                    <ArrowRight className="size-4" aria-hidden />
                  </span>
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-3 self-end sm:gap-4">
                {samples.length > 0
                  ? samples.map((book, i) => (
                      <Link
                        key={book.id}
                        href={`/books/${book.id}`}
                        className={`transition hover:-translate-y-1 ${
                          i === 1 ? "mt-4" : i === 2 ? "mt-8" : ""
                        }`}
                      >
                        <FlatCover
                          title={book.title}
                          accent={book.accent}
                          secondary={book.secondary}
                          className="shadow-none"
                        />
                      </Link>
                    ))
                  : [0, 1, 2].map((slot) => (
                      <div
                        key={slot}
                        className="aspect-[2/3] bg-paper-deep"
                        style={{
                          background: slot === 1 ? category.accent : undefined,
                          marginTop: slot * 16,
                        }}
                        aria-hidden
                      />
                    ))}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
