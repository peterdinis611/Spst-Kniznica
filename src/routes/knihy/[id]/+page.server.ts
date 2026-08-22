import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	borrowBook,
	getActiveLoan,
	getBook,
	countActiveLoans,
	MAX_ACTIVE_LOANS,
	relatedBooks
} from '$lib/server/library';
import { stampDate } from '$lib/format';

export const load: PageServerLoad = async ({ params, locals }) => {
	const current = getBook(params.id);
	if (!current) error(404, 'Karta v katalógu chýba.');

	const userLoan = locals.user ? getActiveLoan(locals.user.id, current.id) : null;
	const activeCount = locals.user ? countActiveLoans(locals.user.id) : 0;

	return {
		book: current,
		related: relatedBooks(current.id, current.category.id),
		userLoan,
		activeCount,
		maxLoans: MAX_ACTIVE_LOANS
	};
};

export const actions: Actions = {
	borrow: async ({ locals, params }) => {
		if (!locals.user) {
			redirect(302, '/prihlasenie');
		}

		const result = borrowBook(locals.user.id, params.id);
		if (!result.ok) {
			return fail(400, { message: result.message });
		}

		return { stamp: 'Vypožičané', sub: stampDate(result.dueAt) };
	}
};
