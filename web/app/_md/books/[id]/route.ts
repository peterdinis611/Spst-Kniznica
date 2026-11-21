import { getBookAction } from "@/lib/catalog/actions";
import { buildBookMarkdown } from "@/lib/seo/entity-markdown";
import { LLM_TXT_HEADERS } from "@/lib/seo/llms-txt";

export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  const result = await getBookAction({ id });
  const book = result?.data?.book;

  if (!book) {
    return new Response("# Kniha nenájdená\n\nTitul v katalógu neexistuje.\n", {
      status: 404,
      headers: LLM_TXT_HEADERS,
    });
  }

  return new Response(buildBookMarkdown(book), {
    status: 200,
    headers: LLM_TXT_HEADERS,
  });
}
