import {
  buildLlmsFullTxt,
  LLM_TXT_HEADERS,
} from "@/lib/seo/llms-txt";

export const revalidate = 3600;

export function GET() {
  return new Response(buildLlmsFullTxt(), {
    status: 200,
    headers: LLM_TXT_HEADERS,
  });
}
