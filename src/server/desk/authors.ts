import { asc, count, eq, ilike, or } from 'drizzle-orm';
import { LIST_LIMIT, slugify } from '@/desk/admin';
import { authorSchema, deskIssue } from '@/desk/desk-fields';
import { refreshCatalog } from '../admin';
import { db } from '../db';
import { author, bookAuthor } from '../db/schema';
import { caught, fail, needle, newId, ok, type DeskResult } from './shared';

export async function listDeskAuthors(query = '') {
	const q = query.trim();
	return await db
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
						ilike(author.name, needle(q)),
						ilike(author.slug, needle(q)),
						ilike(author.role, needle(q))
					)
				: undefined
		)
		.groupBy(author.id, author.name, author.slug, author.bio, author.lifespan, author.role)
		.orderBy(asc(author.name))
		.limit(LIST_LIMIT);
}

export async function getDeskAuthor(id: string) {
	if (!id) return null;
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
		.where(eq(author.id, id))
		.groupBy(author.id, author.name, author.slug, author.bio, author.lifespan, author.role)
		.then((rows) => rows[0] ?? null);
}

export async function saveAuthor(input: {
	id?: string;
	name: string;
	slug: string;
	bio: string;
	lifespan: string;
	role: string;
}): Promise<DeskResult> {
	const name = input.name.trim();
	const slug = slugify(input.slug || name);
	const bio = input.bio.trim();
	const lifespan = input.lifespan.trim();
	const role = input.role.trim();
	const issue = deskIssue(authorSchema, { name, role, bio, lifespan });
	if (issue) return fail(issue);

	try {
		if (input.id) {
			const current = await db
				.select()
				.from(author)
				.where(eq(author.id, input.id))
				.then((rows) => rows[0]);
			if (!current) return fail('Autor sa nenašiel.');
			await db
				.update(author)
				.set({ name, slug, bio, lifespan, role })
				.where(eq(author.id, input.id));
		} else {
			await db.insert(author).values({ id: newId('auth', slug), name, slug, bio, lifespan, role });
		}
	} catch (cause) {
		return caught(cause, 'Tento slug autora už vo fonde je.');
	}

	await refreshCatalog('all');
	return ok();
}

export async function deleteAuthor(id: string): Promise<DeskResult> {
	const gone = await db.delete(author).where(eq(author.id, id)).returning({ id: author.id });
	if (!gone.length) return fail('Autor sa nenašiel.');
	await refreshCatalog('all');
	return ok();
}
