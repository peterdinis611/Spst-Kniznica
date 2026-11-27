import {
  getCategoryAction,
  searchBooksAction,
} from "@/lib/catalog/actions";
import { recordDiscoveryFromRequest } from "@/lib/seo/discovery-monitor";
import { buildCategoryMarkdown } from "@/lib/seo/entity-markdown";
import { LLM_TXT_HEADERS } from "@/lib/seo/llms-txt";


type Props = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const [categoryResult, booksResult] = await Promise.all([
    getCategoryAction({ id }),
    searchBooksAction({ categoryId: id, page: 1, pageSize: 16 }),
  ]);
  const category = categoryResult?.data?.category;

  if (!category) {
    recordDiscoveryFromRequest(request, "category.md", 404);
    return new Response(
      "# Kategória nenájdená\n\nZáznam v katalógu neexistuje.\n",
      {
        status: 404,
        headers: LLM_TXT_HEADERS,
      },
    );
  }

  const titles = (booksResult?.data?.items ?? []).map((book) => book.title);
  recordDiscoveryFromRequest(request, "category.md");

  return new Response(buildCategoryMarkdown(category, titles), {
    status: 200,
    headers: LLM_TXT_HEADERS,
  });
}
