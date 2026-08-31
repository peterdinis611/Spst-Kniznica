import { compactIsbn, looksLikeIsbn } from '$lib/isbn';

export type IsbnCard = {
	isbn: string;
	title: string;
	subtitle: string;
	year: number | null;
	pages: number | null;
	publisher: string;
	description: string;
	authors: string[];
};

export type IsbnLookup = { ok: true; card: IsbnCard } | { ok: false; message: string };

function asText(value: unknown): string {
	if (typeof value === 'string') return value.trim();
	if (value && typeof value === 'object' && 'value' in value) {
		return asText((value as { value: unknown }).value);
	}
	if (Array.isArray(value)) {
		for (const item of value) {
			const text = asText(item);
			if (text) return text;
		}
	}
	return '';
}

function asYear(value: unknown): number | null {
	if (typeof value === 'number' && Number.isInteger(value) && value >= 1400 && value <= 2100) {
		return value;
	}
	if (typeof value === 'string') {
		const match = value.match(/(1[4-9]\d{2}|20\d{2}|2100)/);
		return match ? Number(match[1]) : null;
	}
	if (Array.isArray(value)) {
		const years = value.map(asYear).filter((year): year is number => year != null);
		return years.sort((a, b) => b - a)[0] ?? null;
	}
	return null;
}

function asPages(value: unknown): number | null {
	if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
	if (typeof value === 'string') {
		const pages = Number(value.replace(/\s+/g, ''));
		return Number.isInteger(pages) && pages > 0 ? pages : null;
	}
	return null;
}

function asNames(value: unknown): string[] {
	if (!Array.isArray(value)) return [];
	return value.map(asText).filter(Boolean);
}

export function parseOpenLibrary(isbn: string, payload: unknown): IsbnCard | null {
	const compact = compactIsbn(isbn);
	if (!payload || typeof payload !== 'object') return null;
	const body = payload as Record<string, unknown>;
	const doc = Array.isArray(body.docs)
		? (body.docs[0] as Record<string, unknown> | undefined)
		: body;
	if (!doc) return null;

	const title = asText(doc.title);
	if (!title) return null;

	const description =
		asText(doc.description) ||
		asText(doc.first_sentence) ||
		asText(doc.notes);

	return {
		isbn: asText(Array.isArray(doc.isbn) ? doc.isbn[0] : doc.isbn) || compact,
		title,
		subtitle: asText(doc.subtitle),
		year: asYear(doc.first_publish_year) ?? asYear(doc.publish_year) ?? asYear(doc.publish_date),
		pages: asPages(doc.number_of_pages_median) ?? asPages(doc.number_of_pages),
		publisher: asText(doc.publisher) || asText(doc.publishers),
		description,
		authors: asNames(doc.author_name)
	};
}

async function fetchJson(url: string, signal: AbortSignal) {
	const response = await fetch(url, {
		headers: { accept: 'application/json', 'user-agent': 'SPST-Kniznica/1.0 (school library)' },
		signal
	});
	if (!response.ok) return null;
	return (await response.json()) as unknown;
}

export async function lookupIsbnCard(
	raw: string,
	load: typeof fetchJson = fetchJson
): Promise<IsbnLookup> {
	const isbn = compactIsbn(raw);
	if (!looksLikeIsbn(raw)) return { ok: false, message: 'ISBN má mať 10 alebo 13 číslic.' };

	const signal = AbortSignal.timeout(5000);
	try {
		const search = await load(
			`https://openlibrary.org/search.json?isbn=${encodeURIComponent(isbn)}&limit=1`,
			signal
		);
		const fromSearch = parseOpenLibrary(isbn, search);
		if (fromSearch) return { ok: true, card: fromSearch };

		const edition = await load(
			`https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`,
			signal
		);
		const fromEdition = parseOpenLibrary(isbn, edition);
		if (fromEdition) return { ok: true, card: fromEdition };
	} catch {
		return { ok: false, message: 'Open Library teraz neodpovedá.' };
	}

	return { ok: false, message: 'Toto ISBN v Open Library nie je.' };
}
