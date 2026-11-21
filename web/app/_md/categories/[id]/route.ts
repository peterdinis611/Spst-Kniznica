import {
  getCategoryAction,
  searchBooksAction,
} from "@/lib/catalog/actions";
import { buildCategoryMarkdown } from "@/lib/seo/entity-markdown";
import { LLM_TXT_HEADERS } from "@/lib/seo/llms-txt";

export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const [categoryResult, booksResult] = await Promise.all([
    getCategoryAction({ id }),
    searchBooksAction({ categoryId: id, page: 1, pageSize: 16 }),
  ]);
  const category = categoryResult?.data?.category;

  if (!category) {
    return new Response(
      "# Kategória nenájdená\n\nZáznam v katalógu neexistuje.\n",
      {
        status: 404,
        headers: LLM_TXT_HEADERS,
      },
    );
  }

  const titles = (booksResult?.data?.items ?? []).map((book) => book.title);

  return new Response(buildCategoryMarkdown(category, titles), {
    status: 200,
    headers: LLM_TXT_HEADERS,
  });
}
