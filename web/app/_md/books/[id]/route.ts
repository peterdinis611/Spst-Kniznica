import { getBookAction } from "@/lib/catalog/actions";
import { recordDiscoveryFromRequest } from "@/lib/seo/discovery-monitor";
import { buildBookMarkdown } from "@/lib/seo/entity-markdown";
import { LLM_TXT_HEADERS } from "@/lib/seo/llms-txt";

export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const result = await getBookAction({ id });
  const book = result?.data?.book;

  if (!book) {
    recordDiscoveryFromRequest(request, "book.md", 404);
    return new Response("# Kniha nenájdená\n\nTitul v katalógu neexistuje.\n", {
      status: 404,
      headers: LLM_TXT_HEADERS,
    });
  }

  recordDiscoveryFromRequest(request, "book.md");
  return new Response(buildBookMarkdown(book), {
    status: 200,
    headers: LLM_TXT_HEADERS,
  });
}
