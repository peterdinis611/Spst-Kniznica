import {
  getAuthorAction,
  searchBooksAction,
} from "@/lib/catalog/actions";
import { buildAuthorMarkdown } from "@/lib/seo/entity-markdown";
import { LLM_TXT_HEADERS } from "@/lib/seo/llms-txt";

export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const [authorResult, booksResult] = await Promise.all([
    getAuthorAction({ id }),
    searchBooksAction({ authorId: id, page: 1, pageSize: 24 }),
  ]);
  const author = authorResult?.data?.author;

  if (!author) {
    return new Response("# Autor nenájdený\n\nZáznam v katalógu neexistuje.\n", {
      status: 404,
      headers: LLM_TXT_HEADERS,
    });
  }

  const titles = (booksResult?.data?.items ?? []).map((book) => book.title);

  return new Response(buildAuthorMarkdown(author, titles), {
    status: 200,
    headers: LLM_TXT_HEADERS,
  });
}
