import {
  getAuthorAction,
  searchBooksAction,
} from "@/lib/catalog/actions";
import { recordDiscoveryFromRequest } from "@/lib/seo/discovery-monitor";
import { buildAuthorMarkdown } from "@/lib/seo/entity-markdown";
import { LLM_TXT_HEADERS } from "@/lib/seo/llms-txt";

export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const [authorResult, booksResult] = await Promise.all([
    getAuthorAction({ id }),
    searchBooksAction({ authorId: id, page: 1, pageSize: 24 }),
  ]);
  const author = authorResult?.data?.author;

  if (!author) {
    recordDiscoveryFromRequest(request, "author.md", 404);
    return new Response("# Autor nenájdený\n\nZáznam v katalógu neexistuje.\n", {
      status: 404,
      headers: LLM_TXT_HEADERS,
    });
  }

  const titles = (booksResult?.data?.items ?? []).map((book) => book.title);
  recordDiscoveryFromRequest(request, "author.md");

  return new Response(buildAuthorMarkdown(author, titles), {
    status: 200,
    headers: LLM_TXT_HEADERS,
  });
}
