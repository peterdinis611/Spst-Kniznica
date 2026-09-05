import { searchCatalog } from '@/server/library';
import { eventFromRequest, isRateLimited, RATE_LIMIT_MESSAGE } from '@/server/rate-limit';

const SEARCH_Q_MAX = 80;

export async function GET(request: Request) {
	if (await isRateLimited(eventFromRequest(request), 'search')) {
		return Response.json({ items: [], message: RATE_LIMIT_MESSAGE }, { status: 429 });
	}

	const { searchParams } = new URL(request.url);
	const q = (searchParams.get('q') ?? '').trim().slice(0, SEARCH_Q_MAX);
	if (q.length < 1) return Response.json({ items: [] });
	return Response.json({ items: await searchCatalog(q, 8) });
}
