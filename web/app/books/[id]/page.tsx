import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { fetchBookDetail } from "@/lib/books";

type BookDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Detail knihy",
};

async function BookDetailContent({ params }: BookDetailPageProps) {
  const { id } = await params;
  const book = await fetchBookDetail(id);

  if (!book) {
    notFound();
  }

  return (
    <div className="reveal mt-8 grid gap-10 md:grid-cols-[220px_1fr] md:items-start">
      <div
        className="aspect-[2/3] w-full max-w-[220px] rounded-[1.25rem] shadow-[0_24px_60px_rgba(26,23,20,0.16)]"
        style={{
          background: `linear-gradient(160deg, ${accentFromId(book.id)} 0%, #2a241f 100%)`,
        }}
      >
        <div className="flex h-full flex-col justify-between p-5 text-[#f7f2ea]">
          <p className="font-display text-2xl leading-tight">{book.title}</p>
          <p className="text-sm opacity-80">{book.author}</p>
        </div>
      </div>

      <div>
        <p className="text-xs tracking-[0.22em] text-accent uppercase">
          {book.categoryName ?? "Katalóg"}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink md:text-5xl">
          {book.title}
        </h1>
        {book.subtitle ? (
          <p className="mt-2 text-lg text-muted">{book.subtitle}</p>
        ) : null}
        <p className="mt-4 text-base text-ink/80">{book.author}</p>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <Meta label="Vydavateľ" value={book.publisher} />
          <Meta label="Rok" value={book.publishedYear?.toString()} />
          <Meta label="Jazyk" value={book.language} />
          <Meta label="ISBN" value={book.isbn} />
          <Meta
            label="Exempláre"
            value={`${book.availableCopies} / ${book.totalCopies} dostupných`}
          />
          <Meta label="Umiestnenie" value={book.shelfLocation} />
        </dl>

        {book.description ? (
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted">
            {book.description}
          </p>
        ) : (
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted">
            Detail knihy načítaný z katalógu. Ďalšie metadátá a exempláre spravuje
            BookService cez gateway.
          </p>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/books"
            className="rounded-full bg-accent px-6 py-3 text-sm text-paper transition hover:bg-accent-deep"
          >
            Celý katalóg
          </Link>
          <Link
            href="/authors"
            className="rounded-full border border-rule px-6 py-3 text-sm text-ink transition hover:border-accent"
          >
            Autori
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookDetailPage({ params }: BookDetailPageProps) {
  return (
    <main className="relative flex min-h-full flex-1 flex-col bg-paper">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(166,139,103,0.14),transparent_50%)]" />
      <SiteHeader />

      <article className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-4 md:px-8">
        <Link href="/" className="text-sm text-muted transition hover:text-accent">
          ← Späť na landing
        </Link>

        <Suspense
          fallback={<p className="mt-10 text-muted">Načítavam detail knihy…</p>}
        >
          <BookDetailContent params={params} />
        </Suspense>
      </article>
    </main>
  );
}

function Meta({ label, value }: { label: string; value?: string | null }) {
  if (!value) {
    return null;
  }
  return (
    <div className="border-t border-rule/80 pt-3">
      <dt className="text-[11px] tracking-[0.18em] text-muted uppercase">{label}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  );
}

function accentFromId(id: string): string {
  const accents = ["#8B5A3C", "#2F4A3C", "#4A3B2F", "#3D4F66", "#7A4E2D", "#1F3A34"];
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % accents.length;
  }
  return accents[hash];
}
