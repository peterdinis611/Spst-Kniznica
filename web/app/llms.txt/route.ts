import {
  buildLlmsTxt,
  LLM_TXT_HEADERS,
} from "@/lib/seo/llms-txt";
import { recordDiscoveryFromRequest } from "@/lib/seo/discovery-monitor";

export const revalidate = 3600;

export function GET(request: Request) {
  recordDiscoveryFromRequest(request, "llms.txt");
  return new Response(buildLlmsTxt(), {
    status: 200,
    headers: LLM_TXT_HEADERS,
  });
}
