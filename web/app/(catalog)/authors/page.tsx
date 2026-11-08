import Link from "next/link";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import { getAuthorBooks, MOCK_AUTHORS } from "@/lib/catalog-mock";

export const metadata = {
  title: "Autori",
};

export default function AuthorsPage() {
  return (
    <main className="flex flex-1 flex-col px-5 py-6 md:px-8 md:py-8">
      <CatalogTopBar
        title="Autori"
        searchAction="/books"
        placeholder="Hľadaj autora cez knihy…"
      />

      <section className="mt-10 pb-8">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-display text-2xl text-ink md:text-3xl">
            Knižnica autorov
          </h2>
          <p className="text-sm text-muted">{MOCK_AUTHORS.length} profilov</p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MOCK_AUTHORS.map((author) => {
            const books = getAuthorBooks(author.id);
            return (
              <li key={author.id}>
                <article className="rounded-[1.5rem] border border-rule/70 bg-paper p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(26,23,20,0.08)]">
                  <div className="flex items-start gap-4">
                    <span
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-display text-lg text-paper"
                      style={{ background: author.accent }}
                    >
                      {author.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-2xl text-ink">
                        {author.name}
                      </h3>
                      <p className="mt-1 text-xs tracking-[0.14em] text-muted uppercase">
                        {author.nationality} · {author.bookCount} kníh
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted">
                    {author.bio}
                  </p>
                  {books.length > 0 ? (
                    <ul className="mt-4 space-y-2 border-t border-rule/70 pt-4">
                      {books.slice(0, 2).map((book) => (
                        <li key={book.id}>
                          <Link
                            href={`/books/${book.id}`}
                            className="text-sm text-ink transition hover:text-accent"
                          >
                            {book.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
