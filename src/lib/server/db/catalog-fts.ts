import { sql } from 'drizzle-orm';
import { db } from './index';

const ftsDocument = sql`
	setweight(to_tsvector('simple', coalesce(max(b.title), '')), 'A') ||
	setweight(
		to_tsvector(
			'simple',
			coalesce(max(b.subtitle), '') || ' ' || coalesce(string_agg(a.name, ' ' ORDER BY ba.position), '')
		),
		'B'
	) ||
	setweight(
		to_tsvector(
			'simple',
			coalesce(max(b.description), '') || ' ' ||
			coalesce(max(b.isbn), '') || ' ' ||
			coalesce(max(b.call_number), '') || ' ' ||
			coalesce(max(b.publisher), '')
		),
		'C'
	)
`;

export function catalogTsQuery(raw: string) {
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

export async function ensureCatalogFts() {
	try {
		const rows = await db.execute<{ c: number }>(sql`SELECT count(*)::int AS c FROM book_fts`);
		if (([...rows][0]?.c ?? 0) === 0) await rebuildCatalogFts();
	} catch {
		return;
	}
}

export async function rebuildCatalogFts() {
	await db.execute(sql`DELETE FROM book_fts WHERE book_id NOT IN (SELECT id FROM book)`);
	await db.execute(sql`
		INSERT INTO book_fts (book_id, tsv)
		SELECT b.id, ${ftsDocument}
		FROM book b
		LEFT JOIN book_author ba ON ba.book_id = b.id
		LEFT JOIN author a ON a.id = ba.author_id
		GROUP BY b.id
		ON CONFLICT (book_id) DO UPDATE SET tsv = EXCLUDED.tsv
	`);
}

export async function upsertBookFts(bookId: string) {
	await db.execute(sql`DELETE FROM book_fts WHERE book_id = ${bookId}`);
	await db.execute(sql`
		INSERT INTO book_fts (book_id, tsv)
		SELECT b.id, ${ftsDocument}
		FROM book b
		LEFT JOIN book_author ba ON ba.book_id = b.id
		LEFT JOIN author a ON a.id = ba.author_id
		WHERE b.id = ${bookId}
		GROUP BY b.id
	`);
}

export async function deleteBookFts(bookId: string) {
	await db.execute(sql`DELETE FROM book_fts WHERE book_id = ${bookId}`);
}

export async function ftsBookIds(query: string, limit = 8): Promise<string[]> {
	const match = catalogTsQuery(query);
	if (!match) return [];

	try {
		const rows = await db.execute<{ id: string }>(sql`
			SELECT book_id AS id
			FROM book_fts
			WHERE tsv @@ to_tsquery('simple', ${match})
			ORDER BY ts_rank_cd(tsv, to_tsquery('simple', ${match})) DESC
			LIMIT ${limit}
		`);
		return [...rows].map((row) => row.id);
	} catch {
		return [];
	}
}
