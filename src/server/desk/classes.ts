import { and, eq, isNull } from 'drizzle-orm';
import { shiftSchoolClass } from '@/utils/class-year';
import { db } from '../db';
import { loan, user } from '../db/schema';

export type YearRoll = {
	promoted: number;
	graduated: number;
};

export async function rollSchoolYear(): Promise<YearRoll> {
	const people = await db
		.select({
			id: user.id,
			role: user.role,
			className: user.className
		})
		.from(user);

	let promoted = 0;
	let graduated = 0;

	await db.transaction(async (tx) => {
		for (const person of people) {
			if (person.role !== 'reader') continue;
			const shift = shiftSchoolClass(person.className);
			if (shift.kind === 'skip') continue;

			await tx
				.update(user)
				.set({ className: shift.to, updatedAt: new Date() })
				.where(eq(user.id, person.id));
			await tx
				.update(loan)
				.set({ borrowerClass: shift.to })
				.where(and(eq(loan.userId, person.id), isNull(loan.returnedAt)));

			if (shift.kind === 'graduate') graduated += 1;
			else promoted += 1;
		}
	});

	return { promoted, graduated };
}
