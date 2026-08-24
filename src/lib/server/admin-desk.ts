import { and, asc, count, desc, eq, isNull, like, ne, or, sql } from 'drizzle-orm';
import { isRole, parseRole } from '$lib/ability';
import { LIST_LIMIT, slugify } from '$lib/admin';
import { holdingStatus, reservationStatus } from './db/schema';
import { db } from './db';
import { author, book, bookAuthor, category, holding, loan, reservation, user } from './db/schema';
import { refreshCatalog, uniqueConstraintMessage } from './admin';
import { parseLoanDays } from '$lib/borrow-fields';

export type DeskResult = { ok: true } | { ok: false; message: string };

type DeskTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

function fail(message: string): DeskResult {
	return { ok: false, message };
}

function ok(): DeskResult {
	return { ok: true };
}

function needle(query: string) {
	return `%${query.trim()}%`;
}

function newId(prefix: string, label: string) {
	const slug = slugify(label);
	const token = crypto.randomUUID().slice(0, 6);
	return `${prefix}-${slug || 'zaznam'}-${token}`;
}

function caught(cause: unknown, unique: string): DeskResult {
	return fail(uniqueConstraintMessage(cause, unique) ?? 'Záznam sa neuložil.');
}

function syncCopies(tx: DeskTx, bookId: string) {
	const total = tx.select({ c: count() }).from(holding).where(eq(holding.bookId, bookId)).get()?.c ?? 0;
	const available =
		tx
			.select({ c: count() })
			.from(holding)
			.where(and(eq(holding.bookId, bookId), eq(holding.status, 'available')))
			.get()?.c ?? 0;

	tx.update(book)
		.set({ copiesTotal: total, copiesAvailable: available })
		.where(eq(book.id, bookId))
		.run();
}

function nextInventory(bookId: string, code: string) {
	const token = bookId
		.replace(/^book-/, '')
		.replace(/[^a-z0-9]+/gi, '')
		.slice(0, 10)
		.toUpperCase();
	const existing =
		db.select({ c: count() }).from(holding).where(eq(holding.bookId, bookId)).get()?.c ?? 0;
	return `${code}-${token}-${String(existing + 1).padStart(2, '0')}`;
}

export function deskCounts() {
	return {
		categories: db.select({ c: count() }).from(category).get()?.c ?? 0,
		authors: db.select({ c: count() }).from(author).get()?.c ?? 0,
		books: db.select({ c: count() }).from(book).get()?.c ?? 0,
		links: db.select({ c: count() }).from(bookAuthor).get()?.c ?? 0,
		holdings: db.select({ c: count() }).from(holding).get()?.c ?? 0,
		loans: db.select({ c: count() }).from(loan).get()?.c ?? 0,
		openLoans: db.select({ c: count() }).from(loan).where(isNull(loan.returnedAt)).get()?.c ?? 0,
		reservations: db.select({ c: count() }).from(reservation).get()?.c ?? 0,
		readers: db.select({ c: count() }).from(user).get()?.c ?? 0
	};
}

export function listDeskCategories(query = '') {
	const q = query.trim();
	const rows = db
		.select({
			id: category.id,
			name: category.name,
			slug: category.slug,
			description: category.description,
			code: category.code,
			accent: category.accent,
			sortOrder: category.sortOrder,
			bookCount: count(book.id)
		})
		.from(category)
		.leftJoin(book, eq(book.categoryId, category.id))
		.where(
			q
				? or(
						like(category.name, needle(q)),
						like(category.slug, needle(q)),
						like(category.code, needle(q))
					)
				: undefined
		)
		.groupBy(
			category.id,
			category.name,
			category.slug,
			category.description,
			category.code,
			category.accent,
			category.sortOrder
		)
		.orderBy(asc(category.sortOrder), asc(category.name))
		.limit(LIST_LIMIT)
		.all();

	return rows;
}

export function getDeskCategory(id: string) {
	if (!id) return null;
	return (
		db
			.select({
				id: category.id,
				name: category.name,
				slug: category.slug,
				description: category.description,
				code: category.code,
				accent: category.accent,
				sortOrder: category.sortOrder,
				bookCount: count(book.id)
			})
			.from(category)
			.leftJoin(book, eq(book.categoryId, category.id))
			.where(eq(category.id, id))
			.groupBy(
				category.id,
				category.name,
				category.slug,
				category.description,
				category.code,
				category.accent,
				category.sortOrder
			)
			.get() ?? null
	);
}

export function saveCategory(input: {
	id?: string;
	name: string;
	slug: string;
	description: string;
	code: string;
	accent: string;
	sortOrder: number;
}): DeskResult {
	const name = input.name.trim();
	const slug = slugify(input.slug || name);
	const description = input.description.trim();
	const code = input.code.trim().toUpperCase();
	const accent = input.accent.trim() || '#3c2a21';
	if (name.length < 2) return fail('Názov odboru je krátky.');
	if (code.length < 2 || code.length > 8) return fail('Kód odboru má 2–8 znakov.');
	if (!description) return fail('Dopíš popis odboru.');

	try {
		if (input.id) {
			const current = db.select().from(category).where(eq(category.id, input.id)).get();
			if (!current) return fail('Odbor sa nenašiel.');
			db.update(category)
				.set({ name, slug, description, code, accent, sortOrder: input.sortOrder })
				.where(eq(category.id, input.id))
				.run();
		} else {
			db.insert(category)
				.values({
					id: newId('cat', slug),
					name,
					slug,
					description,
					code,
					accent,
					sortOrder: input.sortOrder
				})
				.run();
		}
	} catch (cause) {
		return caught(cause, 'Tento kód alebo slug už vo fonde je.');
	}

	refreshCatalog('all');
	return ok();
}

export function deleteCategory(id: string): DeskResult {
	const used = db.select({ c: count() }).from(book).where(eq(book.categoryId, id)).get()?.c ?? 0;
	if (used > 0) return fail('Odbor má knihy. Najprv ich presuň alebo zmaž.');
	const gone = db.delete(category).where(eq(category.id, id)).run();
	if (!gone.changes) return fail('Odbor sa nenašiel.');
	refreshCatalog('all');
	return ok();
}

export function listDeskAuthors(query = '') {
	const q = query.trim();
	return db
		.select({
			id: author.id,
			name: author.name,
			slug: author.slug,
			bio: author.bio,
			lifespan: author.lifespan,
			role: author.role,
			bookCount: count(bookAuthor.bookId)
		})
		.from(author)
		.leftJoin(bookAuthor, eq(bookAuthor.authorId, author.id))
		.where(
			q
				? or(
						like(author.name, needle(q)),
						like(author.slug, needle(q)),
						like(author.role, needle(q))
					)
				: undefined
		)
		.groupBy(author.id, author.name, author.slug, author.bio, author.lifespan, author.role)
		.orderBy(asc(author.name))
		.limit(LIST_LIMIT)
		.all();
}

export function getDeskAuthor(id: string) {
	if (!id) return null;
	return (
		db
			.select({
				id: author.id,
				name: author.name,
				slug: author.slug,
				bio: author.bio,
				lifespan: author.lifespan,
				role: author.role,
				bookCount: count(bookAuthor.bookId)
			})
			.from(author)
			.leftJoin(bookAuthor, eq(bookAuthor.authorId, author.id))
			.where(eq(author.id, id))
			.groupBy(author.id, author.name, author.slug, author.bio, author.lifespan, author.role)
			.get() ?? null
	);
}

export function saveAuthor(input: {
	id?: string;
	name: string;
	slug: string;
	bio: string;
	lifespan: string;
	role: string;
}): DeskResult {
	const name = input.name.trim();
	const slug = slugify(input.slug || name);
	const bio = input.bio.trim();
	const lifespan = input.lifespan.trim();
	const role = input.role.trim();
	if (name.length < 2) return fail('Meno autora je krátke.');
	if (!role) return fail('Doplň rolu autora.');
	if (!bio) return fail('Doplň medailón.');
	if (!lifespan) return fail('Doplň roky.');

	try {
		if (input.id) {
			const current = db.select().from(author).where(eq(author.id, input.id)).get();
			if (!current) return fail('Autor sa nenašiel.');
			db.update(author).set({ name, slug, bio, lifespan, role }).where(eq(author.id, input.id)).run();
		} else {
			db.insert(author)
				.values({ id: newId('auth', slug), name, slug, bio, lifespan, role })
				.run();
		}
	} catch (cause) {
		return caught(cause, 'Tento slug autora už vo fonde je.');
	}

	refreshCatalog('all');
	return ok();
}

export function deleteAuthor(id: string): DeskResult {
	const gone = db.delete(author).where(eq(author.id, id)).run();
	if (!gone.changes) return fail('Autor sa nenašiel.');
	refreshCatalog('all');
	return ok();
}

export function listDeskBooks(query = '') {
	const q = query.trim();
	return db
		.select({
			id: book.id,
			title: book.title,
			subtitle: book.subtitle,
			year: book.year,
			pages: book.pages,
			isbn: book.isbn,
			description: book.description,
			callNumber: book.callNumber,
			categoryId: book.categoryId,
			categoryName: category.name,
			copiesTotal: book.copiesTotal,
			copiesAvailable: book.copiesAvailable,
			publisher: book.publisher,
			language: book.language,
			featured: book.featured
		})
		.from(book)
		.innerJoin(category, eq(book.categoryId, category.id))
		.where(
			q
				? or(
						like(book.title, needle(q)),
						like(book.isbn, needle(q)),
						like(book.callNumber, needle(q)),
						like(book.publisher, needle(q))
					)
				: undefined
		)
		.orderBy(asc(book.title))
		.limit(LIST_LIMIT)
		.all();
}

export function getDeskBook(id: string) {
	if (!id) return null;
	return (
		db
			.select({
				id: book.id,
				title: book.title,
				subtitle: book.subtitle,
				year: book.year,
				pages: book.pages,
				isbn: book.isbn,
				description: book.description,
				callNumber: book.callNumber,
				categoryId: book.categoryId,
				categoryName: category.name,
				copiesTotal: book.copiesTotal,
				copiesAvailable: book.copiesAvailable,
				publisher: book.publisher,
				language: book.language,
				featured: book.featured
			})
			.from(book)
			.innerJoin(category, eq(book.categoryId, category.id))
			.where(eq(book.id, id))
			.get() ?? null
	);
}

export function bookAuthorIds(bookId: string) {
	return db
		.select({ authorId: bookAuthor.authorId, position: bookAuthor.position })
		.from(bookAuthor)
		.where(eq(bookAuthor.bookId, bookId))
		.orderBy(asc(bookAuthor.position))
		.all();
}

export function categoryOptions() {
	return db
		.select({ id: category.id, name: category.name, code: category.code })
		.from(category)
		.orderBy(asc(category.sortOrder), asc(category.name))
		.all();
}

export function authorOptions() {
	return db
		.select({ id: author.id, name: author.name })
		.from(author)
		.orderBy(asc(author.name))
		.all();
}

export function bookOptions() {
	return db
		.select({ id: book.id, title: book.title, callNumber: book.callNumber })
		.from(book)
		.orderBy(asc(book.title))
		.all();
}

export function readerOptions() {
	return db
		.select({ id: user.id, name: user.name, email: user.email })
		.from(user)
		.orderBy(asc(user.name))
		.all();
}

export function saveBook(input: {
	id?: string;
	title: string;
	subtitle: string;
	year: number;
	pages: number;
	isbn: string;
	description: string;
	callNumber: string;
	categoryId: string;
	publisher: string;
	language: string;
	featured: boolean;
	authorIds: string[];
	copies?: number;
}): DeskResult {
	const title = input.title.trim();
	const isbn = input.isbn.trim();
	const callNumber = input.callNumber.trim();
	const description = input.description.trim();
	const publisher = input.publisher.trim();
	const language = (input.language.trim() || 'sk').slice(0, 8);
	const subtitle = input.subtitle.trim() || null;
	if (title.length < 2) return fail('Názov knihy je krátky.');
	if (!isbn) return fail('Doplň ISBN.');
	if (!callNumber) return fail('Doplň signatúru.');
	if (!description) return fail('Doplň anotáciu.');
	if (!publisher) return fail('Doplň vydavateľa.');
	if (input.year < 1400 || input.year > 2100) return fail('Rok vydania nevyzerá.');
	if (input.pages < 1) return fail('Počet strán musí byť kladný.');
	const cat = db.select().from(category).where(eq(category.id, input.categoryId)).get();
	if (!cat) return fail('Vyber odbor.');

	const authors = input.authorIds.filter(Boolean);
	let bookId = input.id ?? '';

	try {
		db.transaction((tx) => {
			if (input.id) {
				const current = tx.select().from(book).where(eq(book.id, input.id)).get();
				if (!current) throw new Error('Kniha sa nenašla.');
				tx.update(book)
					.set({
						title,
						subtitle,
						year: input.year,
						pages: input.pages,
						isbn,
						description,
						callNumber,
						categoryId: input.categoryId,
						publisher,
						language,
						featured: input.featured
					})
					.where(eq(book.id, input.id))
					.run();
				tx.delete(bookAuthor).where(eq(bookAuthor.bookId, input.id)).run();
				bookId = input.id;
			} else {
				bookId = newId('book', title);
				tx.insert(book)
					.values({
						id: bookId,
						title,
						subtitle,
						year: input.year,
						pages: input.pages,
						isbn,
						description,
						callNumber,
						categoryId: input.categoryId,
						publisher,
						language,
						featured: input.featured,
						copiesTotal: 0,
						copiesAvailable: 0
					})
					.run();

				const copies = Math.max(0, Math.min(input.copies ?? 1, 40));
				for (let n = 1; n <= copies; n += 1) {
					tx.insert(holding)
						.values({
							id: `${bookId}-h${String(n).padStart(2, '0')}`,
							bookId,
							inventoryNo: `${cat.code}-${bookId.replace(/^book-/, '').replace(/[^a-z0-9]+/gi, '').slice(0, 10).toUpperCase()}-${String(n).padStart(2, '0')}`,
							status: 'available'
						})
						.run();
				}
				syncCopies(tx, bookId);
			}

			if (authors.length) {
				tx.insert(bookAuthor)
					.values(authors.map((authorId, position) => ({ bookId, authorId, position })))
					.run();
			}
		});
	} catch (cause) {
		const text = cause instanceof Error ? cause.message : '';
		if (text === 'Kniha sa nenašla.') return fail(text);
		return caught(cause, 'ISBN alebo signatúra už vo fonde je.');
	}

	refreshCatalog({ bookId });
	return ok();
}

export function deleteBook(id: string): DeskResult {
	const open =
		db.select({ c: count() }).from(loan).where(and(eq(loan.bookId, id), isNull(loan.returnedAt))).get()
			?.c ?? 0;
	if (open > 0) return fail('Kniha má aktívne výpožičky. Najprv ich vráť.');
	db.delete(loan).where(eq(loan.bookId, id)).run();
	const gone = db.delete(book).where(eq(book.id, id)).run();
	if (!gone.changes) return fail('Kniha sa nenašla.');
	refreshCatalog({ deletedBookId: id });
	return ok();
}

export function listDeskLinks(query = '') {
	const q = query.trim();
	return db
		.select({
			bookId: bookAuthor.bookId,
			authorId: bookAuthor.authorId,
			position: bookAuthor.position,
			bookTitle: book.title,
			authorName: author.name
		})
		.from(bookAuthor)
		.innerJoin(book, eq(book.id, bookAuthor.bookId))
		.innerJoin(author, eq(author.id, bookAuthor.authorId))
		.where(
			q
				? or(like(book.title, needle(q)), like(author.name, needle(q)))
				: undefined
		)
		.orderBy(asc(book.title), asc(bookAuthor.position))
		.limit(LIST_LIMIT)
		.all();
}

export function saveLink(input: { bookId: string; authorId: string; position: number }): DeskResult {
	const held = db.select({ id: book.id }).from(book).where(eq(book.id, input.bookId)).get();
	const person = db.select({ id: author.id }).from(author).where(eq(author.id, input.authorId)).get();
	if (!held) return fail('Kniha sa nenašla.');
	if (!person) return fail('Autor sa nenašiel.');

	try {
		db.insert(bookAuthor)
			.values({
				bookId: input.bookId,
				authorId: input.authorId,
				position: Math.max(0, input.position)
			})
			.onConflictDoUpdate({
				target: [bookAuthor.bookId, bookAuthor.authorId],
				set: { position: Math.max(0, input.position) }
			})
			.run();
	} catch (cause) {
		return caught(cause, 'Táto väzba už vo fonde je.');
	}

	refreshCatalog({ bookId: input.bookId });
	return ok();
}

export function deleteLink(bookId: string, authorId: string): DeskResult {
	const gone = db
		.delete(bookAuthor)
		.where(and(eq(bookAuthor.bookId, bookId), eq(bookAuthor.authorId, authorId)))
		.run();
	if (!gone.changes) return fail('Väzba sa nenašla.');
	refreshCatalog({ bookId });
	return ok();
}

export function listDeskHoldings(query = '') {
	const q = query.trim();
	return db
		.select({
			id: holding.id,
			bookId: holding.bookId,
			inventoryNo: holding.inventoryNo,
			status: holding.status,
			acquiredAt: holding.acquiredAt,
			bookTitle: book.title
		})
		.from(holding)
		.innerJoin(book, eq(book.id, holding.bookId))
		.where(
			q
				? or(
						like(holding.inventoryNo, needle(q)),
						like(book.title, needle(q)),
						like(holding.status, needle(q))
					)
				: undefined
		)
		.orderBy(desc(holding.acquiredAt))
		.limit(LIST_LIMIT)
		.all();
}

export function getDeskHolding(id: string) {
	if (!id) return null;
	return (
		db
			.select({
				id: holding.id,
				bookId: holding.bookId,
				inventoryNo: holding.inventoryNo,
				status: holding.status,
				acquiredAt: holding.acquiredAt,
				bookTitle: book.title
			})
			.from(holding)
			.innerJoin(book, eq(book.id, holding.bookId))
			.where(eq(holding.id, id))
			.get() ?? null
	);
}

export function saveHolding(input: {
	id?: string;
	bookId: string;
	inventoryNo: string;
	status: string;
	acquiredAt?: Date | null;
}): DeskResult {
	const inventoryNo = input.inventoryNo.trim();
	if (!holdingStatus.includes(input.status as (typeof holdingStatus)[number])) {
		return fail('Stav výtlačka nie je v zozname.');
	}
	const status = input.status as (typeof holdingStatus)[number];
	const held = db.select().from(book).where(eq(book.id, input.bookId)).get();
	if (!held) return fail('Vyber knihu.');

	try {
		db.transaction((tx) => {
			if (input.id) {
				const current = tx.select().from(holding).where(eq(holding.id, input.id)).get();
				if (!current) throw new Error('Výtlačok sa nenašiel.');
				if (status === 'available' && current.status === 'loaned') {
					const open = tx
						.select({ c: count() })
						.from(loan)
						.where(and(eq(loan.holdingId, current.id), isNull(loan.returnedAt)))
						.get()?.c ?? 0;
					if (open > 0) throw new Error('Výtlačok je na výpožičke. Najprv ho vráť.');
				}
				tx.update(holding)
					.set({
						bookId: input.bookId,
						inventoryNo: inventoryNo || current.inventoryNo,
						status,
						acquiredAt: input.acquiredAt ?? current.acquiredAt
					})
					.where(eq(holding.id, input.id))
					.run();
				if (current.bookId !== input.bookId) syncCopies(tx, current.bookId);
				syncCopies(tx, input.bookId);
			} else {
				const cat = tx.select({ code: category.code }).from(category).where(eq(category.id, held.categoryId)).get();
				tx.insert(holding)
					.values({
						id: crypto.randomUUID(),
						bookId: input.bookId,
						inventoryNo: inventoryNo || nextInventory(input.bookId, cat?.code ?? 'FON'),
						status,
						acquiredAt: input.acquiredAt ?? new Date()
					})
					.run();
				syncCopies(tx, input.bookId);
			}
		});
	} catch (cause) {
		const text = cause instanceof Error ? cause.message : '';
		if (text === 'Výtlačok sa nenašiel.' || text.startsWith('Výtlačok je na výpožičke')) return fail(text);
		return caught(cause, 'Toto inventárne číslo už vo fonde je.');
	}

	refreshCatalog({ bookId: input.bookId });
	return ok();
}

export function deleteHolding(id: string): DeskResult {
	const current = db.select().from(holding).where(eq(holding.id, id)).get();
	if (!current) return fail('Výtlačok sa nenašiel.');
	const open =
		db
			.select({ c: count() })
			.from(loan)
			.where(and(eq(loan.holdingId, id), isNull(loan.returnedAt)))
			.get()?.c ?? 0;
	if (open > 0) return fail('Výtlačok je na výpožičke. Najprv ho vráť.');

	db.transaction((tx) => {
		tx.delete(holding).where(eq(holding.id, id)).run();
		syncCopies(tx, current.bookId);
	});
	refreshCatalog({ bookId: current.bookId });
	return ok();
}

export function listDeskLoans(query = '') {
	const q = query.trim();
	return db
		.select({
			id: loan.id,
			bookId: loan.bookId,
			holdingId: loan.holdingId,
			userId: loan.userId,
			borrowedAt: loan.borrowedAt,
			dueAt: loan.dueAt,
			returnedAt: loan.returnedAt,
			renewalCount: loan.renewalCount,
			borrowerFirstName: loan.borrowerFirstName,
			borrowerLastName: loan.borrowerLastName,
			borrowerClass: loan.borrowerClass,
			loanDays: loan.loanDays,
			bookTitle: book.title,
			readerName: user.name,
			readerEmail: user.email
		})
		.from(loan)
		.innerJoin(book, eq(book.id, loan.bookId))
		.innerJoin(user, eq(user.id, loan.userId))
		.where(
			q
				? or(
						like(book.title, needle(q)),
						like(user.name, needle(q)),
						like(user.email, needle(q)),
						like(loan.borrowerLastName, needle(q)),
						like(loan.borrowerClass, needle(q))
					)
				: undefined
		)
		.orderBy(desc(loan.borrowedAt))
		.limit(LIST_LIMIT)
		.all();
}

export function getDeskLoan(id: string) {
	if (!id) return null;
	return (
		db
			.select({
				id: loan.id,
				bookId: loan.bookId,
				holdingId: loan.holdingId,
				userId: loan.userId,
				borrowedAt: loan.borrowedAt,
				dueAt: loan.dueAt,
				returnedAt: loan.returnedAt,
				renewalCount: loan.renewalCount,
				borrowerFirstName: loan.borrowerFirstName,
				borrowerLastName: loan.borrowerLastName,
				borrowerClass: loan.borrowerClass,
				loanDays: loan.loanDays,
				bookTitle: book.title,
				readerName: user.name,
				readerEmail: user.email
			})
			.from(loan)
			.innerJoin(book, eq(book.id, loan.bookId))
			.innerJoin(user, eq(user.id, loan.userId))
			.where(eq(loan.id, id))
			.get() ?? null
	);
}

export function saveLoan(input: {
	id?: string;
	bookId: string;
	holdingId: string;
	userId: string;
	borrowerFirstName: string;
	borrowerLastName: string;
	borrowerClass: string;
	loanDays: number;
	borrowedAt?: Date | null;
	dueAt?: Date | null;
	returnedAt?: Date | null;
	renewalCount?: number;
}): DeskResult {
	const first = input.borrowerFirstName.trim();
	const last = input.borrowerLastName.trim();
	const klass = input.borrowerClass.trim();
	if (first.length < 2 || last.length < 2) return fail('Meno a priezvisko na lístku.');
	if (!klass) return fail('Doplň triedu.');
	const days = parseLoanDays(String(input.loanDays));
	if (!days) return fail('Doba výpožičky nie je v rozsahu.');
	const held = db.select().from(book).where(eq(book.id, input.bookId)).get();
	const reader = db.select().from(user).where(eq(user.id, input.userId)).get();
	if (!held) return fail('Vyber knihu.');
	if (!reader) return fail('Vyber čitateľa.');

	try {
		db.transaction((tx) => {
			if (input.id) {
				const current = tx.select().from(loan).where(eq(loan.id, input.id)).get();
				if (!current) throw new Error('Výpožička sa nenašla.');
				const borrowedAt = input.borrowedAt ?? current.borrowedAt;
				const dueAt =
					input.dueAt ?? new Date(borrowedAt.getTime() + days * 24 * 60 * 60 * 1000);
				tx.update(loan)
					.set({
						borrowerFirstName: first,
						borrowerLastName: last,
						borrowerClass: klass,
						loanDays: days,
						borrowedAt,
						dueAt,
						returnedAt: input.returnedAt ?? current.returnedAt,
						renewalCount: input.renewalCount ?? current.renewalCount
					})
					.where(eq(loan.id, input.id))
					.run();
			} else {
				const copy = input.holdingId
					? tx.select().from(holding).where(eq(holding.id, input.holdingId)).get()
					: tx
							.select()
							.from(holding)
							.where(and(eq(holding.bookId, input.bookId), eq(holding.status, 'available')))
							.get();
				if (!copy || copy.status !== 'available') {
					throw new Error('Žiadny voľný výtlačok.');
				}
				const now = input.borrowedAt ?? new Date();
				const dueAt = input.dueAt ?? new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
				tx.insert(loan)
					.values({
						bookId: input.bookId,
						holdingId: copy.id,
						userId: input.userId,
						borrowedAt: now,
						dueAt,
						borrowerFirstName: first,
						borrowerLastName: last,
						borrowerClass: klass,
						loanDays: days
					})
					.run();
				tx.update(holding).set({ status: 'loaned' }).where(eq(holding.id, copy.id)).run();
				syncCopies(tx, input.bookId);
			}
		});
	} catch (cause) {
		const text = cause instanceof Error ? cause.message : '';
		if (text === 'Výpožička sa nenašla.' || text === 'Žiadny voľný výtlačok.') return fail(text);
		return caught(cause, 'Výpožička sa neuložila.');
	}

	refreshCatalog({ bookId: input.bookId });
	return ok();
}

export function returnDeskLoan(id: string): DeskResult {
	const current = db.select().from(loan).where(eq(loan.id, id)).get();
	if (!current) return fail('Výpožička sa nenašla.');
	if (current.returnedAt) return fail('Táto kniha je už vrátená.');

	db.transaction((tx) => {
		tx.update(loan).set({ returnedAt: new Date() }).where(eq(loan.id, id)).run();
		if (current.holdingId) {
			tx.update(holding).set({ status: 'available' }).where(eq(holding.id, current.holdingId)).run();
		}
		syncCopies(tx, current.bookId);
	});
	refreshCatalog({ bookId: current.bookId });
	return ok();
}

export function deleteLoan(id: string): DeskResult {
	const current = db.select().from(loan).where(eq(loan.id, id)).get();
	if (!current) return fail('Výpožička sa nenašla.');

	db.transaction((tx) => {
		if (!current.returnedAt && current.holdingId) {
			tx.update(holding).set({ status: 'available' }).where(eq(holding.id, current.holdingId)).run();
		}
		tx.delete(loan).where(eq(loan.id, id)).run();
		if (!current.returnedAt) syncCopies(tx, current.bookId);
	});
	refreshCatalog({ bookId: current.bookId });
	return ok();
}

export function listDeskReservations(query = '') {
	const q = query.trim();
	return db
		.select({
			id: reservation.id,
			bookId: reservation.bookId,
			userId: reservation.userId,
			createdAt: reservation.createdAt,
			expiresAt: reservation.expiresAt,
			status: reservation.status,
			bookTitle: book.title,
			readerName: user.name,
			readerEmail: user.email
		})
		.from(reservation)
		.innerJoin(book, eq(book.id, reservation.bookId))
		.innerJoin(user, eq(user.id, reservation.userId))
		.where(
			q
				? or(
						like(book.title, needle(q)),
						like(user.name, needle(q)),
						like(reservation.status, needle(q))
					)
				: undefined
		)
		.orderBy(desc(reservation.createdAt))
		.limit(LIST_LIMIT)
		.all();
}

export function getDeskReservation(id: string) {
	if (!id) return null;
	return (
		db
			.select({
				id: reservation.id,
				bookId: reservation.bookId,
				userId: reservation.userId,
				createdAt: reservation.createdAt,
				expiresAt: reservation.expiresAt,
				status: reservation.status,
				bookTitle: book.title,
				readerName: user.name,
				readerEmail: user.email
			})
			.from(reservation)
			.innerJoin(book, eq(book.id, reservation.bookId))
			.innerJoin(user, eq(user.id, reservation.userId))
			.where(eq(reservation.id, id))
			.get() ?? null
	);
}

export function saveReservation(input: {
	id?: string;
	bookId: string;
	userId: string;
	status: string;
	createdAt?: Date | null;
	expiresAt?: Date | null;
}): DeskResult {
	if (!reservationStatus.includes(input.status as (typeof reservationStatus)[number])) {
		return fail('Stav rezervácie nie je v zozname.');
	}
	const status = input.status as (typeof reservationStatus)[number];
	const held = db.select({ id: book.id }).from(book).where(eq(book.id, input.bookId)).get();
	const reader = db.select({ id: user.id }).from(user).where(eq(user.id, input.userId)).get();
	if (!held) return fail('Vyber knihu.');
	if (!reader) return fail('Vyber čitateľa.');
	const createdAt = input.createdAt ?? new Date();
	const expiresAt = input.expiresAt ?? new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);

	try {
		if (input.id) {
			const current = db.select().from(reservation).where(eq(reservation.id, input.id)).get();
			if (!current) return fail('Rezervácia sa nenašla.');
			db.update(reservation)
				.set({ bookId: input.bookId, userId: input.userId, status, createdAt, expiresAt })
				.where(eq(reservation.id, input.id))
				.run();
		} else {
			db.insert(reservation)
				.values({
					bookId: input.bookId,
					userId: input.userId,
					status,
					createdAt,
					expiresAt
				})
				.run();
		}
	} catch (cause) {
		return caught(cause, 'Rezervácia sa neuložila.');
	}

	return ok();
}

export function deleteReservation(id: string): DeskResult {
	const gone = db.delete(reservation).where(eq(reservation.id, id)).run();
	if (!gone.changes) return fail('Rezervácia sa nenašla.');
	return ok();
}

export function listDeskReaders(query = '') {
	const q = query.trim();
	return db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			emailVerified: user.emailVerified,
			createdAt: user.createdAt,
			loanCount: sql<number>`(select count(*) from loan where loan.user_id = ${user.id})`.as(
				'loanCount'
			)
		})
		.from(user)
		.where(q ? or(like(user.name, needle(q)), like(user.email, needle(q))) : undefined)
		.orderBy(asc(user.name))
		.limit(LIST_LIMIT)
		.all();
}

export function getDeskReader(id: string) {
	if (!id) return null;
	return (
		db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				emailVerified: user.emailVerified,
				createdAt: user.createdAt,
				loanCount: sql<number>`(select count(*) from loan where loan.user_id = ${user.id})`.as(
					'loanCount'
				)
			})
			.from(user)
			.where(eq(user.id, id))
			.get() ?? null
	);
}

export function saveReader(input: {
	id: string;
	name: string;
	email: string;
	role?: string;
}): DeskResult {
	const name = input.name.trim();
	const email = input.email.trim().toLowerCase();
	if (name.length < 2) return fail('Meno čitateľa je krátke.');
	if (!email.includes('@')) return fail('E-mail nevyzerá ako adresa.');
	if (input.role !== undefined && !isRole(input.role)) return fail('Rola nie je v zozname.');

	try {
		const current = db.select().from(user).where(eq(user.id, input.id)).get();
		if (!current) return fail('Čitateľ sa nenašiel.');
		const role = input.role === undefined ? parseRole(current.role) : input.role;
		if (parseRole(current.role) === 'librarian' && role === 'reader') {
			const others =
				db
					.select({ c: count() })
					.from(user)
					.where(and(eq(user.role, 'librarian'), ne(user.id, input.id)))
					.get()?.c ?? 0;
			if (others === 0) return fail('Posledného knihovníka z pultu nedáš.');
		}
		db.update(user)
			.set({ name, email, role, updatedAt: new Date() })
			.where(eq(user.id, input.id))
			.run();
	} catch (cause) {
		return caught(cause, 'Tento e-mail už má preukaz.');
	}

	return ok();
}

export function deleteReader(id: string): DeskResult {
	const current = db.select().from(user).where(eq(user.id, id)).get();
	if (!current) return fail('Čitateľ sa nenašiel.');
	if (parseRole(current.role) === 'librarian') {
		const others =
			db
				.select({ c: count() })
				.from(user)
				.where(and(eq(user.role, 'librarian'), ne(user.id, id)))
				.get()?.c ?? 0;
		if (others === 0) return fail('Posledného knihovníka z pultu nedáš.');
	}
	const open =
		db.select({ c: count() }).from(loan).where(and(eq(loan.userId, id), isNull(loan.returnedAt))).get()
			?.c ?? 0;
	if (open > 0) return fail('Čitateľ má knihy vonku. Najprv ich vráť.');
	const gone = db.delete(user).where(eq(user.id, id)).run();
	if (!gone.changes) return fail('Čitateľ sa nenašiel.');
	return ok();
}
