type Chapter = {
	url: string;
	data?: { order?: number; title?: string };
};

export function sortDocChapters<T extends Chapter>(chapters: T[]) {
	return [...chapters].sort((a, b) => {
		const ao = a.data?.order ?? 50;
		const bo = b.data?.order ?? 50;
		if (ao !== bo) return ao - bo;
		return (a.data?.title ?? a.url).localeCompare(b.data?.title ?? b.url, 'sk');
	});
}
