import { and, asc, count, eq, ilike, isNull, ne, or, sql } from 'drizzle-orm';
import { parseRole } from '$lib/ability';
import { LIST_LIMIT } from '$lib/admin';
import { normalizeClass } from '$lib/borrow-fields';
import { deskIssue, readerSchema } from '$lib/desk-fields';
import { db } from '../db';
import { loan, user } from '../db/schema';
import { caught, fail, needle, ok, type DeskResult } from './shared';

export async function listDeskReaders(query = '') {
	const q = query.trim();
	return await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			className: user.className,
			emailVerified: user.emailVerified,
			createdAt: user.createdAt,
			loanCount: sql<number>`(select count(*) from loan where loan.user_id = ${user.id})`.as(
				'loanCount'
			)
		})
		.from(user)
		.where(q ? or(ilike(user.name, needle(q)), ilike(user.email, needle(q))) : undefined)
		.orderBy(asc(user.name))
		.limit(LIST_LIMIT);
}

export async function getDeskReader(id: string) {
	if (!id) return null;
	return db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			className: user.className,
			emailVerified: user.emailVerified,
			createdAt: user.createdAt,
			loanCount: sql<number>`(select count(*) from loan where loan.user_id = ${user.id})`.as(
				'loanCount'
			)
		})
		.from(user)
		.where(eq(user.id, id))
		.then((rows) => rows[0] ?? null);
}

export async function saveReader(input: {
	id: string;
	name: string;
	email: string;
	role?: string;
	className?: string;
}): Promise<DeskResult> {
	const name = input.name.trim();
	const email = input.email.trim().toLowerCase();
	const className = normalizeClass(input.className ?? '');
	const issue = deskIssue(readerSchema, { name, email, role: input.role, className });
	if (issue) return fail(issue);

	try {
		const current = await db
			.select()
			.from(user)
			.where(eq(user.id, input.id))
			.then((rows) => rows[0]);
		if (!current) return fail('Čitateľ sa nenašiel.');
		const role = input.role === undefined ? parseRole(current.role) : input.role;
		if (parseRole(current.role) === 'librarian' && role !== 'librarian') {
			const others =
				(
					await db
						.select({ c: count() })
						.from(user)
						.where(and(eq(user.role, 'librarian'), ne(user.id, input.id)))
						.then((rows) => rows[0])
				)?.c ?? 0;
			if (others === 0) return fail('Posledného knihovníka z pultu nedáš.');
		}
		await db
			.update(user)
			.set({ name, email, role, className, updatedAt: new Date() })
			.where(eq(user.id, input.id));
	} catch (cause) {
		return caught(cause, 'Tento e-mail už má preukaz.');
	}

	return ok();
}

export async function deleteReader(id: string): Promise<DeskResult> {
	const current = await db
		.select()
		.from(user)
		.where(eq(user.id, id))
		.then((rows) => rows[0]);
	if (!current) return fail('Čitateľ sa nenašiel.');
	if (parseRole(current.role) === 'librarian') {
		const others =
			(
				await db
					.select({ c: count() })
					.from(user)
					.where(and(eq(user.role, 'librarian'), ne(user.id, id)))
					.then((rows) => rows[0])
			)?.c ?? 0;
		if (others === 0) return fail('Posledného knihovníka z pultu nedáš.');
	}
	const open =
		(
			await db
				.select({ c: count() })
				.from(loan)
				.where(and(eq(loan.userId, id), isNull(loan.returnedAt)))
				.then((rows) => rows[0])
		)?.c ?? 0;
	if (open > 0) return fail('Čitateľ má knihy vonku. Najprv ich vráť.');
	const gone = await db.delete(user).where(eq(user.id, id)).returning({ id: user.id });
	if (!gone.length) return fail('Čitateľ sa nenašiel.');
	return ok();
}
