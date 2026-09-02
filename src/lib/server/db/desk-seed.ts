import { and, count, eq, isNull, notInArray } from 'drizzle-orm';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { HOLD_DAYS } from '$lib/hold';
import { db } from './index';
import { book, holding, loan, reservation, user } from './schema';
import { invalidateCatalogCache } from '../catalog-cache';

function shouldSeedDesk() {
	const flag = env.SEED_DESK?.trim().toLowerCase();
	if (flag === 'off' || flag === '0') return false;
	if (flag === 'on' || flag === '1') return true;
	return dev;
}

const readers = [
	{
		id: 'seed-r-hora',
		name: 'Adam Hora',
		email: 'adam.hora@fond.spst.test',
		className: 'II.A',
		ageDays: 40
	},
	{
		id: 'seed-r-kovacova',
		name: 'Barbora Kováčová',
		email: 'barbora.kovacova@fond.spst.test',
		className: 'III.B',
		ageDays: 40
	},
	{
		id: 'seed-r-nagy',
		name: 'Cyril Nagy',
		email: 'cyril.nagy@fond.spst.test',
		className: 'I.C',
		ageDays: 40
	},
	{
		id: 'seed-r-tothova',
		name: 'Dana Tóthová',
		email: 'dana.tothova@fond.spst.test',
		className: 'IV.A',
		ageDays: 40
	},
	{
		id: 'seed-r-novak',
		name: 'Filip Novák',
		email: 'filip.novak@fond.spst.test',
		className: 'I.C',
		ageDays: 0
	}
] as const;

async function takeCopy(bookId: string) {
	const openIds = (
		await db
			.select({ id: loan.holdingId })
			.from(loan)
			.where(isNull(loan.returnedAt))
	).flatMap((row) => (row.id ? [row.id] : []));

	const orphaned = await db
		.select()
		.from(holding)
		.where(
			and(
				eq(holding.bookId, bookId),
				eq(holding.status, 'loaned'),
				...(openIds.length ? [notInArray(holding.id, openIds)] : [])
			)
		)
		.then((rows) => rows[0] ?? null);
	if (orphaned) return orphaned;

	const free = await db
		.select()
		.from(holding)
		.where(and(eq(holding.bookId, bookId), eq(holding.status, 'available')))
		.then((rows) => rows[0] ?? null);
	if (!free) return null;

	const held = await db.select().from(book).where(eq(book.id, bookId)).then((rows) => rows[0]);
	await db.transaction(async (tx) => {
		await tx.update(holding).set({ status: 'loaned' }).where(eq(holding.id, free.id));
		if (held) {
			await tx
				.update(book)
				.set({ copiesAvailable: Math.max(0, held.copiesAvailable - 1) })
				.where(eq(book.id, bookId));
		}
	});
	return free;
}

function daysFrom(now: Date, days: number) {
	return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

function names(full: string) {
	const parts = full.trim().split(/\s+/);
	return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
}

export async function ensureDeskScene() {
	if (!shouldSeedDesk()) return;
	const existing =
		(await db.select({ c: count() }).from(loan).then((rows) => rows[0]?.c ?? 0)) ?? 0;
	if (existing > 0) return;

	const now = new Date();
	for (const person of readers) {
		const createdAt = daysFrom(now, -person.ageDays);
		await db
			.insert(user)
			.values({
				id: person.id,
				name: person.name,
				email: person.email,
				emailVerified: true,
				role: 'reader',
				className: person.className,
				createdAt,
				updatedAt: createdAt
			})
			.onConflictDoNothing();
	}

	await db
		.insert(user)
		.values({
			id: 'seed-t-belkova',
			name: 'Eva Belková',
			email: 'eva.belkova@fond.spst.test',
			emailVerified: true,
			role: 'teacher',
			className: 'II.A',
			createdAt: daysFrom(now, -40),
			updatedAt: daysFrom(now, -40)
		})
		.onConflictDoNothing();

	const slips: {
		userId: string;
		bookId: string;
		dueDays: number;
		offered: boolean;
	}[] = [
		{ userId: 'seed-r-hora', bookId: 'book-algoritmy', dueDays: -10, offered: false },
		{ userId: 'seed-r-kovacova', bookId: 'book-databazy', dueDays: 5, offered: true },
		{ userId: 'seed-r-nagy', bookId: 'book-siete', dueDays: 1, offered: false },
		{ userId: 'seed-r-tothova', bookId: 'book-cpp', dueDays: 14, offered: false }
	];

	for (const slip of slips) {
		const copy = await takeCopy(slip.bookId);
		if (!copy) continue;
		const person = readers.find((item) => item.id === slip.userId);
		const who = names(person?.name ?? '');
		const borrowedAt = daysFrom(now, -21);
		await db.insert(loan).values({
			bookId: slip.bookId,
			holdingId: copy.id,
			userId: slip.userId,
			borrowedAt,
			dueAt: daysFrom(now, slip.dueDays),
			borrowerFirstName: who.first,
			borrowerLastName: who.last,
			borrowerClass: person?.className ?? '',
			loanDays: 21,
			returnOfferedAt: slip.offered ? now : null
		});
	}

	await db
		.insert(reservation)
		.values([
			{
				bookId: 'book-kreslenie',
				userId: 'seed-r-novak',
				status: 'pending',
				createdAt: now,
				expiresAt: daysFrom(now, 30)
			},
			{
				bookId: 'book-mat1',
				userId: 'seed-r-hora',
				status: 'fulfilled',
				createdAt: daysFrom(now, -2),
				expiresAt: daysFrom(now, HOLD_DAYS - 2)
			}
		])
		.onConflictDoNothing();

	invalidateCatalogCache();
}
