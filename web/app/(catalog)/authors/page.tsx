import Link from "next/link";
import { CatalogTopBar } from "@/components/catalog/CatalogTopBar";
import { getAuthorBooks, MOCK_AUTHORS } from "@/lib/catalog-mock";

export const metadata = {
  title: "Autori",
};

export default function AuthorsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <CatalogTopBar
        title="Autori fondu"
        lead="Karty autorov s počtom titulov a ukážkou kníh. Klikni na titul a skoč do detailu."
        showSearch={false}
      />

      <div className="mt-6 flex items-end justify-between gap-4 border-b border-rule pb-3">
        <p className="text-sm text-muted-foreground">Abecedný prehľad</p>
        <p className="font-display text-xl text-ink">{MOCK_AUTHORS.length}</p>
      </div>

      <ul className="grid gap-4 pb-16 pt-8 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_AUTHORS.map((author, index) => {
          const books = getAuthorBooks(author.id);
          return (
            <li
              key={author.id}
              className="group flex flex-col border border-rule bg-paper transition hover:border-ink"
            >
              <div
                className="h-2 w-full"
                style={{ background: author.accent }}
                aria-hidden
              />
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                    {String(index + 1).padStart(2, "0")} · {author.nationality}
                  </p>
                  <p className="bg-accent px-2 py-0.5 font-display text-lg text-ink">
                    {author.bookCount}
                  </p>
                </div>
                <h2 className="mt-3 font-display text-2xl leading-tight text-ink sm:text-3xl">
                  {author.name}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {author.bio}
                </p>
                {books.length > 0 ? (
                  <ul className="mt-5 space-y-2 border-t border-rule pt-4">
                    {books.slice(0, 3).map((book) => (
                      <li key={book.id}>
                        <Link
                          href={`/books/${book.id}`}
                          className="text-sm text-ink underline-offset-4 transition hover:underline"
                        >
                          {book.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-auto pt-5 text-xs text-muted-foreground">
                    Zatiaľ bez titulov v mock dátach
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
