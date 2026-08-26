import { sql } from 'drizzle-orm';
import { db } from './index';

export async function ensureCatalogFts() {
	return;
}

export async function rebuildCatalogFts() {
	return;
}

export async function upsertBookFts(_bookId: string) {
	return;
}

export async function deleteBookFts(_bookId: string) {
	return;
}

export async function ftsBookIds(query: string, limit = 8): Promise<string[]> {
	const match = tsQuery(query);
	if (!match) return [];

	try {
		const rows = await db.execute<{ id: string }>(sql`
			SELECT b.id
			FROM book b
			LEFT JOIN book_author ba ON ba.book_id = b.id
			LEFT JOIN author a ON a.id = ba.author_id
			GROUP BY b.id
			HAVING to_tsvector(
				'simple',
				coalesce(max(b.title), '') || ' ' ||
				coalesce(max(b.subtitle), '') || ' ' ||
				coalesce(max(b.description), '') || ' ' ||
				coalesce(max(b.isbn), '') || ' ' ||
				coalesce(max(b.call_number), '') || ' ' ||
				coalesce(max(b.publisher), '') || ' ' ||
				coalesce(string_agg(a.name, ' '), '')
			) @@ to_tsquery('simple', ${match})
			LIMIT ${limit}
		`);
		return [...rows].map((row) => row.id);
	} catch {
		return [];
	}
}

function tsQuery(raw: string) {
	const tokens = raw
		.trim()
		.toLowerCase()
		.replace(/['\\:&|!*()]/g, ' ')
		.split(/\s+/)
		.filter((part) => part.length > 0)
		.slice(0, 6);
	if (tokens.length === 0) return null;
	return tokens.map((part) => `${part}:*`).join(' & ');
}
