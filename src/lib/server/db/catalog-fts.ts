import { eq } from 'drizzle-orm';
import { db, sqlite } from './index';
import { author, book, bookAuthor } from './schema';

export function ensureCatalogFts() {
	sqlite.exec(`
		CREATE VIRTUAL TABLE IF NOT EXISTS book_fts USING fts5(
			book_id UNINDEXED,
			title,
			subtitle,
			description,
			isbn,
			call_number,
			publisher,
			authors,
			tokenize = 'unicode61'
		)
	`);

	const populated = sqlite.prepare('SELECT count(*) AS c FROM book_fts').get() as { c: number };
	if ((populated?.c ?? 0) === 0) rebuildCatalogFts();
}

export function rebuildCatalogFts() {
	sqlite.exec('DELETE FROM book_fts');

	const rows = db
		.select({
			id: book.id,
			title: book.title,
			subtitle: book.subtitle,
			description: book.description,
			isbn: book.isbn,
			callNumber: book.callNumber,
			publisher: book.publisher,
			authorName: author.name
		})
		.from(book)
		.leftJoin(bookAuthor, eq(bookAuthor.bookId, book.id))
		.leftJoin(author, eq(author.id, bookAuthor.authorId))
		.all();

	const byId = new Map<
		string,
		{
			title: string;
			subtitle: string;
			description: string;
			isbn: string;
			callNumber: string;
			publisher: string;
			authors: string[];
		}
	>();

	for (const row of rows) {
		let item = byId.get(row.id);
		if (!item) {
			item = {
				title: row.title,
				subtitle: row.subtitle ?? '',
				description: row.description,
				isbn: row.isbn,
				callNumber: row.callNumber,
				publisher: row.publisher,
				authors: []
			};
			byId.set(row.id, item);
		}
		if (row.authorName && !item.authors.includes(row.authorName)) {
			item.authors.push(row.authorName);
		}
	}

	const insert = sqlite.prepare(
		`INSERT INTO book_fts (book_id, title, subtitle, description, isbn, call_number, publisher, authors)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	);

	const write = sqlite.transaction(() => {
		for (const [id, item] of byId) {
			insert.run(
				id,
				item.title,
				item.subtitle,
				item.description,
				item.isbn,
				item.callNumber,
				item.publisher,
				item.authors.join(' ')
			);
		}
	});

	write();
}

function bookFtsRow(bookId: string) {
	const rows = db
		.select({
			id: book.id,
			title: book.title,
			subtitle: book.subtitle,
			description: book.description,
			isbn: book.isbn,
			callNumber: book.callNumber,
			publisher: book.publisher,
			authorName: author.name
		})
		.from(book)
		.leftJoin(bookAuthor, eq(bookAuthor.bookId, book.id))
		.leftJoin(author, eq(author.id, bookAuthor.authorId))
		.where(eq(book.id, bookId))
		.all();

	if (rows.length === 0) return null;

	const authors = rows
		.map((row) => row.authorName)
		.filter((name): name is string => Boolean(name));

	const first = rows[0];
	return {
		id: first.id,
		title: first.title,
		subtitle: first.subtitle ?? '',
		description: first.description,
		isbn: first.isbn,
		callNumber: first.callNumber,
		publisher: first.publisher,
		authors: [...new Set(authors)].join(' ')
	};
}

export function upsertBookFts(bookId: string) {
	sqlite.prepare('DELETE FROM book_fts WHERE book_id = ?').run(bookId);
	const row = bookFtsRow(bookId);
	if (!row) return;

	sqlite
		.prepare(
			`INSERT INTO book_fts (book_id, title, subtitle, description, isbn, call_number, publisher, authors)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			row.id,
			row.title,
			row.subtitle,
			row.description,
			row.isbn,
			row.callNumber,
			row.publisher,
			row.authors
		);
}

export function deleteBookFts(bookId: string) {
	sqlite.prepare('DELETE FROM book_fts WHERE book_id = ?').run(bookId);
}

export function ftsBookIds(query: string, limit = 8): string[] {
	const match = ftsQuery(query);
	if (!match) return [];

	try {
		const rows = sqlite
			.prepare(`SELECT book_id FROM book_fts WHERE book_fts MATCH ? LIMIT ?`)
			.all(match, limit) as { book_id: string }[];
		return rows.map((row) => row.book_id);
	} catch {
		return [];
	}
}

function ftsQuery(raw: string) {
	const tokens = raw
		.trim()
		.toLowerCase()
		.replace(/['"^]/g, ' ')
		.split(/\s+/)
		.filter((part) => part.length > 0)
		.slice(0, 6);
	if (tokens.length === 0) return null;
	return tokens.map((part) => `"${part}"*`).join(' AND ');
}
