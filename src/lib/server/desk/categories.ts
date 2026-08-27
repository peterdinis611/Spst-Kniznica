import { asc, count, eq, ilike, or } from 'drizzle-orm';
import { LIST_LIMIT, slugify } from '$lib/admin';
import { refreshCatalog } from '../admin';
import { db } from '../db';
import { book, category } from '../db/schema';
import { caught, fail, needle, newId, ok, type DeskResult } from './shared';

export async function listDeskCategories(query = '') {
	const q = query.trim();
	return await db
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
						ilike(category.name, needle(q)),
						ilike(category.slug, needle(q)),
						ilike(category.code, needle(q))
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
		.limit(LIST_LIMIT);
}

export async function getDeskCategory(id: string) {
	if (!id) return null;
	return db
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
		.then((rows) => rows[0] ?? null);
}

export async function saveCategory(input: {
	id?: string;
	name: string;
	slug: string;
	description: string;
	code: string;
	accent: string;
	sortOrder: number;
}): Promise<DeskResult> {
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
			const current = await db
				.select()
				.from(category)
				.where(eq(category.id, input.id))
				.then((rows) => rows[0]);
			if (!current) return fail('Odbor sa nenašiel.');
			await db
				.update(category)
				.set({ name, slug, description, code, accent, sortOrder: input.sortOrder })
				.where(eq(category.id, input.id));
		} else {
			await db.insert(category).values({
				id: newId('cat', slug),
				name,
				slug,
				description,
				code,
				accent,
				sortOrder: input.sortOrder
			});
		}
	} catch (cause) {
		return caught(cause, 'Tento kód alebo slug už vo fonde je.');
	}

	await refreshCatalog('all');
	return ok();
}

export async function deleteCategory(id: string): Promise<DeskResult> {
	const used = await db
		.select({ c: count() })
		.from(book)
		.where(eq(book.categoryId, id))
		.then((rows) => rows[0]?.c ?? 0);
	if (used > 0) return fail('Odbor má knihy. Najprv ich presuň alebo zmaž.');
	const gone = await db.delete(category).where(eq(category.id, id)).returning({ id: category.id });
	if (!gone.length) return fail('Odbor sa nenašiel.');
	await refreshCatalog('all');
	return ok();
}
