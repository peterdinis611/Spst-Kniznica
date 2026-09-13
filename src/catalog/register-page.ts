export const REGISTER_PAGE_SIZE = 48;

export function clampRegisterPage(
	raw: string | undefined,
	total: number,
	pageSize = REGISTER_PAGE_SIZE
) {
	const pages = Math.max(1, Math.ceil(Math.max(0, total) / pageSize));
	const parsed = Number.parseInt(raw ?? '1', 10);
	const page = Number.isFinite(parsed) ? Math.min(pages, Math.max(1, parsed)) : 1;
	return { page, pages, pageSize, offset: (page - 1) * pageSize };
}

export function registerHref(
	path: '/books' | '/holdings',
	params: { q?: string; odbor?: string; page?: number }
) {
	const search = new URLSearchParams();
	if (params.q?.trim()) search.set('q', params.q.trim());
	if (params.odbor?.trim()) search.set('odbor', params.odbor.trim());
	if (params.page && params.page > 1) search.set('strana', String(params.page));
	const qs = search.toString();
	return qs ? `${path}?${qs}` : path;
}
