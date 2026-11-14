import {
  clipOgDescription,
  ogContentType,
  ogSize,
  renderOg,
  truncateOg,
} from "@/lib/og/render";
import {
  getAuthorAction,
  searchBooksAction,
} from "@/lib/catalog/actions";

export const alt = "Autor · SPST Knižnica";
export const size = ogSize;
export const contentType = ogContentType;

type Props = { params: Promise<{ id: string }> };

export default async function AuthorOpenGraphImage({ params }: Props) {
  const { id } = await params;
  const result = await getAuthorAction({ id });
  const author = result?.data?.author;

  if (!author) {
    return renderOg({
      variant: "entity",
      eyebrow: "Autor",
      title: "Nenájdený",
      description: "Tento autor v katalógu SPST Knižnice nie je.",
      footerRight: "autor · 404",
    });
  }

  const booksResult = await searchBooksAction({
    authorId: author.id,
    page: 1,
    pageSize: 1,
  });
  const bookCount = booksResult?.data?.totalCount ?? 0;

  const meta = [author.nationality !== "—" ? author.nationality : null, author.birthYear]
    .filter(Boolean)
    .join(" · ");

  const description =
    author.bio !== "Bez biografie."
      ? author.bio
      : `${author.name} vo fonde SPST Knižnice.`;

  return renderOg({
    variant: "entity",
    eyebrow: "Autor",
    title: truncateOg(author.name, 56),
    meta: meta || undefined,
    description: clipOgDescription(description),
    badge: {
      label:
        bookCount === 1 ? "1 titul" : `${bookCount} titulov`,
      tone: "neutral",
    },
    accentColor: author.accent,
    footerRight: "autor · katalog",
  });
}
