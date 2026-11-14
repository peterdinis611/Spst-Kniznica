import {
  clipOgDescription,
  ogContentType,
  ogSize,
  renderOg,
  truncateOg,
} from "@/lib/og/render";
import { getBookAction } from "@/lib/catalog/actions";

export const alt = "Kniha · SPST Knižnica";
export const size = ogSize;
export const contentType = ogContentType;

type Props = { params: Promise<{ id: string }> };

export default async function BookOpenGraphImage({ params }: Props) {
  const { id } = await params;
  const result = await getBookAction({ id });
  const book = result?.data?.book;

  if (!book) {
    return renderOg({
      variant: "entity",
      eyebrow: "Kniha",
      title: "Nenájdená",
      description: "Tento titul v katalógu SPST Knižnice nie je.",
      footerRight: "kniha · 404",
    });
  }

  const available = book.availableCopies > 0;
  const meta = [book.author, book.year].filter(Boolean).join(" · ");
  const description =
    book.description?.trim() ||
    `${book.title} od ${book.author} vo fonde SPST Knižnice.`;

  return renderOg({
    variant: "entity",
    eyebrow: book.categoryName?.trim() || "Kniha",
    title: truncateOg(book.title, 56),
    meta: meta || undefined,
    description: clipOgDescription(description),
    badge: {
      label: available
        ? `Dostupné · ${book.availableCopies}/${book.totalCopies}`
        : `Požičané · 0/${book.totalCopies}`,
      tone: available ? "ok" : "warn",
    },
    accentColor: book.accent,
    footerRight: "kniha · katalog",
  });
}
