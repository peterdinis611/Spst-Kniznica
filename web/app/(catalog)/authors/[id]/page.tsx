import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ArrowRight } from "@/components/icons";
import { AuthorAuthorityLinks } from "@/components/catalog/AuthorAuthorityLinks";
import { BookCard } from "@/components/catalog/BookCard";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { CatalogEmpty } from "@/components/catalog/CatalogEmpty";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { JsonLd } from "@/components/seo/JsonLd";
import { AccentFillDiv } from "@/components/styled/primitives";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildBooksCatalogHref } from "@/lib/catalog/catalog-url";
import {
  getAuthorAction,
  searchBooksAction,
} from "@/lib/catalog/actions";
import {
  authorSameAsLinks,
  breadcrumbJsonLd,
  personJsonLd,
} from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

type AuthorDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: AuthorDetailPageProps): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const result = await getAuthorAction({ id });
  const author = result?.data?.author;

  if (!author) {
    return {
      title: "Autor nenájdený",
      robots: { index: false, follow: false },
    };
  }

  const description =
    author.bio !== "Bez biografie."
      ? author.bio
      : `${author.name} vo fonde SPST Knižnice.`;

  return buildPageMetadata({
    title: author.name,
    description,
    path: `/authors/${author.id}`,
    type: "profile",
    keywords: [author.name, author.nationality].filter(
      (value) => value && value !== "—",
    ),
  });
}

async function AuthorDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const [authorResult, booksResult] = await Promise.all([
    getAuthorAction({ id }),
    searchBooksAction({ authorId: id, page: 1, pageSize: 50 }),
  ]);

  const author = authorResult?.data?.author;
  if (!author) {
    notFound();
  }

  const books = booksResult?.data?.items ?? [];
  const totalInFond =
    author.bookCount > 0
      ? author.bookCount
      : (booksResult?.data?.totalCount ?? books.length);
  const booksHref = buildBooksCatalogHref({ authors: [author.id] });

  return (
    <>
      <JsonLd
        data={[
          personJsonLd({
            id: author.id,
            name: author.name,
            bio: author.bio,
            nationality: author.nationality,
            birthYear: author.birthYear,
            sameAs: authorSameAsLinks(author),
          }),
          breadcrumbJsonLd([
            { name: "Domov", path: "/" },
            { name: "Autori", path: "/authors" },
            { name: author.name, path: `/authors/${author.id}` },
          ]),
        ]}
      />
      <CatalogBreadcrumb
        items={[
          { label: "Katalóg", href: "/books" },
          { label: "Autori", href: "/authors" },
          { label: author.name },
        ]}
      />

      <div className="mt-2 grid gap-10 border-t border-rule pt-8 sm:mt-4 sm:pt-10 lg:grid-cols-[minmax(8rem,11rem)_1fr] lg:items-start lg:gap-14">
        <div className="lg:sticky lg:top-8">
          <AccentFillDiv
            $color={author.accent}
            className="mx-auto size-28 overflow-hidden rounded-full shadow-[0_28px_56px_-40px_rgba(14,26,36,0.5)] sm:size-32 lg:mx-0"
          >
            <Avatar className="size-full bg-transparent">
              <AvatarFallback className="bg-transparent font-display text-4xl text-white sm:text-5xl">
                {author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </AccentFillDiv>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-none border border-sage/30 bg-mint/50 px-3 py-1 font-mono text-[10px] tracking-[0.12em] text-sage uppercase hover:bg-mint/50 dark:border-sage/35 dark:bg-paper-deep">
              Autor
            </Badge>
            <Badge
              variant="outline"
              className="rounded-none px-3 py-1 font-mono text-[10px] tracking-[0.12em] uppercase"
            >
              {author.nationality}
            </Badge>
            {!author.isActive ? (
              <Badge
                variant="outline"
                className="rounded-none border-stair-2/40 px-3 py-1 font-mono text-[10px] tracking-[0.12em] text-stair-2 uppercase"
              >
                Neaktívny
              </Badge>
            ) : null}
          </div>

          <h1 className="mt-5 font-display text-[clamp(2rem,6vw,3.4rem)] leading-[1.05] tracking-tight text-ink">
            {author.name}
          </h1>

          <dl className="mt-8 flex max-w-xl flex-wrap gap-x-10 gap-y-4 border-y border-rule py-5 dark:border-white/10">
            {author.birthYear ? (
              <div>
                <dt className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                  Rok narodenia
                </dt>
                <dd className="mt-1 font-display text-2xl tabular-nums text-ink">
                  {author.birthYear}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                Tituly vo fonde
              </dt>
              <dd className="mt-1 font-display text-2xl tabular-nums text-ink">
                <span className="text-sage">{totalInFond}</span>
              </dd>
            </div>
          </dl>

          <div className="mt-8 max-w-2xl border-l-2 border-sage/50 pl-5">
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base sm:leading-7">
              {author.bio}
            </p>
          </div>

          <AuthorAuthorityLinks
            profileUrl={author.profileUrl}
            wikidataId={author.wikidataId}
            viafId={author.viafId}
          />

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              className="group h-auto gap-0 overflow-hidden rounded-full border border-ink bg-paper p-0 text-ink hover:bg-paper"
              render={<Link href={booksHref} />}
            >
              <span className="px-5 py-3 text-sm font-semibold">
                Knihy v katalógu
              </span>
              <span className="flex items-center self-stretch bg-ink px-3 text-paper transition group-hover:bg-accent group-hover:text-accent-foreground">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-ink"
              render={<Link href="/authors" />}
            >
              Všetci autori
            </Button>
          </div>
        </div>
      </div>

      <section
        className="mt-14 border-t border-rule pt-10 sm:mt-16 sm:pt-12 dark:border-white/10"
        aria-labelledby="author-books-heading"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Fond
            </p>
            <h2
              id="author-books-heading"
              className="mt-2 font-display text-[clamp(1.6rem,4vw,2.25rem)] leading-tight tracking-tight text-ink"
            >
              Tituly autora
            </h2>
          </div>
          <Badge
            variant="secondary"
            className="h-auto rounded-full bg-paper-deep px-3 py-1 font-display text-sm tabular-nums text-ink ring-1 ring-rule dark:ring-white/10"
          >
            {totalInFond}{" "}
            <span className="font-sans font-normal text-muted-foreground">
              {totalInFond === 1 ? "titul" : "titulov"}
            </span>
          </Badge>
        </div>

        {books.length === 0 ? (
          <CatalogEmpty
            title="Zatiaľ bez kníh"
            description="Vo fonde zatiaľ nie sú priradené tituly tohto autora."
            resetHref="/books"
            resetLabel="Do katalógu"
          />
        ) : (
          <>
            <ul className="mt-8 grid grid-cols-2 gap-3 pb-6 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-5">
              {books.map((book, index) => (
                <li key={book.id}>
                  <BookCard book={book} index={index} />
                </li>
              ))}
            </ul>
            {totalInFond > books.length ? (
              <p className="pb-16 text-sm text-muted-foreground">
                Zobrazených {books.length} z {totalInFond}.{" "}
                <Link
                  href={booksHref}
                  className="font-semibold text-sage underline-offset-4 hover:text-ink hover:underline"
                >
                  Otvoriť celý katalóg autora
                </Link>
              </p>
            ) : (
              <div className="pb-16" />
            )}
          </>
        )}
      </section>
    </>
  );
}

export default function AuthorDetailPage({ params }: AuthorDetailPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton rows={2} />}>
        <AuthorDetailContent params={params} />
      </Suspense>
    </div>
  );
}
