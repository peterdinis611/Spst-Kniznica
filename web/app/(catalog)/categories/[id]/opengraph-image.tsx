import {
  clipOgDescription,
  ogContentType,
  ogSize,
  renderOg,
  truncateOg,
} from "@/lib/og/render";
import {
  getCategoryAction,
  searchBooksAction,
} from "@/lib/catalog/actions";

export const alt = "Kategória · SPST Knižnica";
export const size = ogSize;
export const contentType = ogContentType;

type Props = { params: Promise<{ id: string }> };

export default async function CategoryOpenGraphImage({ params }: Props) {
  const { id } = await params;
  const result = await getCategoryAction({ id });
  const category = result?.data?.category;

  if (!category) {
    return renderOg({
      variant: "entity",
      eyebrow: "Kategória",
      title: "Nenájdená",
      description: "Táto kategória v katalógu SPST Knižnice nie je.",
      footerRight: "kategoria · 404",
    });
  }

  const booksResult = await searchBooksAction({
    categoryId: category.id,
    page: 1,
    pageSize: 1,
  });
  const bookCount = booksResult?.data?.totalCount ?? 0;

  const description =
    category.description !== "Bez popisu."
      ? category.description
      : `${category.name} — tematická rada vo fonde SPST Knižnice.`;

  return renderOg({
    variant: "entity",
    eyebrow: "Kategória",
    title: truncateOg(category.name, 56),
    description: clipOgDescription(description),
    badge: {
      label:
        bookCount === 1 ? "1 titul" : `${bookCount} titulov`,
      tone: "neutral",
    },
    accentColor: category.accent,
    footerRight: "kategoria · katalog",
  });
}
