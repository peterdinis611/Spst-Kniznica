import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { FlatCover } from "@/components/landing/FlatCover";
import { CatalogBreadcrumb } from "@/components/catalog/CatalogBreadcrumb";
import { CatalogSkeleton } from "@/components/catalog/CatalogSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MOCK_BOOKS } from "@/lib/catalog-mock";
import { fetchBookDetail } from "@/lib/books";

type BookDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata = {
  title: "Detail knihy",
};

async function BookDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mock = MOCK_BOOKS.find((book) => book.id === id);
  const apiBook = mock ? null : await fetchBookDetail(id);
  const book = mock
    ? {
        id: mock.id,
        title: mock.title,
        author: mock.author,
        categoryName: mock.categoryName,
        publishedYear: mock.year,
        availableCopies: mock.availableCopies,
        totalCopies: mock.totalCopies,
        description:
          "Mock detail pre návrh katalógu. Po napojení API sa zobrazia skutočné dáta z BookService.",
        accent: mock.accent,
        secondary: mock.secondary,
      }
    : apiBook
      ? {
          ...apiBook,
          accent: "#1F4E8C",
          secondary: "#F6E27A",
        }
      : null;

  if (!book) {
    notFound();
  }

  const available = book.availableCopies > 0;

  return (
    <>
      <CatalogBreadcrumb
        items={[
          { label: "Katalóg", href: "/books" },
          { label: "Knihy", href: "/books" },
          { label: book.title },
        ]}
      />

      <div className="mt-2 grid gap-8 border-t border-rule pt-8 sm:mt-4 sm:gap-10 sm:pt-10 md:grid-cols-[240px_1fr] md:items-start">
        <FlatCover
          title={book.title}
          author={book.author}
          accent={book.accent}
          secondary={book.secondary}
          className="mx-auto w-44 max-w-full sm:w-full"
        />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-accent text-black hover:bg-accent">
              {book.categoryName ?? "Katalóg"}
            </Badge>
            <Badge
              variant={available ? "secondary" : "outline"}
              className="rounded-full"
            >
              {available ? "Dostupné" : "Nedostupné"}
            </Badge>
          </div>

          <h1 className="mt-4 font-display text-[clamp(2rem,6vw,3.4rem)] leading-[1.05] tracking-tight text-ink">
            {book.title}
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            {book.author}
          </p>

          <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
            {book.publishedYear ? (
              <Card size="sm" className="rounded-none ring-rule dark:ring-white/10">
                <CardHeader className="pb-0">
                  <CardDescription className="text-[11px] tracking-[0.16em] uppercase">
                    Rok
                  </CardDescription>
                  <CardTitle className="font-display text-2xl text-ink">
                    {book.publishedYear}
                  </CardTitle>
                </CardHeader>
              </Card>
            ) : null}
            <Card size="sm" className="rounded-none ring-rule dark:ring-white/10">
              <CardHeader className="pb-0">
                <CardDescription className="text-[11px] tracking-[0.16em] uppercase">
                  Exempláre
                </CardDescription>
                <CardTitle className="font-display text-2xl text-ink">
                  {book.availableCopies}/{book.totalCopies}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {book.description ? (
            <Card className="mt-8 max-w-2xl rounded-none bg-paper-deep/50 ring-rule dark:ring-white/10">
              <CardContent className="pt-(--card-spacing)">
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {book.description}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Separator className="my-8 max-w-xl" />

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              className="group h-auto gap-0 overflow-hidden rounded-full border border-ink bg-paper p-0 text-ink hover:bg-paper"
              render={<Link href="/books" />}
            >
              <span className="px-5 py-3 text-sm font-semibold">
                Späť do fondu
              </span>
              <span className="flex items-center self-stretch bg-ink px-3 text-paper transition group-hover:bg-accent group-hover:text-black">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-ink"
              render={<Link href="/authors" />}
            >
              Autori
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-ink"
              render={<Link href="/categories" />}
            >
              Kategórie
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function BookDetailPage({ params }: BookDetailPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 md:px-8 md:py-10">
      <Suspense fallback={<CatalogSkeleton rows={2} />}>
        <BookDetailContent params={params} />
      </Suspense>
    </main>
  );
}
