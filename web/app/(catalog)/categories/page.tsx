import Link from "next/link";
import { BookCover } from "@/components/catalog/BookCover";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import { getCategoryBooks, MOCK_CATEGORIES } from "@/lib/catalog-mock";

export const metadata = {
  title: "Kategórie",
};

export default function CategoriesPage() {
  return (
    <main className="flex flex-1 flex-col px-5 py-6 md:px-8 md:py-8">
      <CatalogTopBar
        title="Kategórie"
        searchAction="/books"
        placeholder="Filtrovať cez katalóg kníh…"
      />

      <section className="mt-10 pb-8">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-display text-2xl text-ink md:text-3xl">
            Book category
          </h2>
          <p className="text-sm text-muted">{MOCK_CATEGORIES.length} zbierok</p>
        </div>

        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {MOCK_CATEGORIES.map((category) => {
            const sample = getCategoryBooks(category.id)[0];
            return (
              <li key={category.id}>
                <Link
                  href={`/books?category=${category.id}`}
                  className="group block rounded-[1.5rem] border border-rule/70 bg-paper p-4 transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(26,23,20,0.09)]"
                >
                  <div className="flex h-36 items-center justify-center rounded-[1.1rem] bg-[#ebe6de]">
                    <BookCover
                      title={sample?.title ?? category.name}
                      accent={category.accent}
                      secondary={category.secondary}
                      className="h-28 w-[4.6rem] transition duration-300 group-hover:-rotate-6 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-4 font-display text-xl text-ink">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{category.description}</p>
                  <p className="mt-3 text-xs tracking-[0.14em] text-accent uppercase">
                    {category.bookCount} kníh
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
