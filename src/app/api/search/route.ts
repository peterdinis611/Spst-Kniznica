import { searchCatalog } from '@/server/library';

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const q = searchParams.get('q')?.trim() ?? '';
	if (q.length < 1) return Response.json({ items: [] });
	return Response.json({ items: await searchCatalog(q, 8) });
}
