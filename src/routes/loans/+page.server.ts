import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	clearReturnedLoans,
	countActiveLoans,
	listLoans,
	MAX_ACTIVE_LOANS,
	returnBook
} from '$lib/server/library';
import { stampDate } from '$lib/format';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const loans = listLoans(locals.user.id);
	const active = loans.filter((item) => !item.returnedAt);
	const history = loans.filter((item) => item.returnedAt);

	return {
		reader: {
			id: locals.user.id,
			name: locals.user.name,
			email: locals.user.email,
			role: locals.user.role
		},
		loans: active,
		history,
		activeCount: countActiveLoans(locals.user.id),
		maxLoans: MAX_ACTIVE_LOANS
	};
};

export const actions: Actions = {
	return: async ({ locals, request }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const formData = await request.formData();
		const loanId = formData.get('loanId')?.toString() ?? '';
		const result = returnBook(locals.user.id, loanId);

		if (!result.ok) {
			return fail(400, { message: result.message });
		}

		return { stamp: 'Vrátené', sub: stampDate(new Date()) };
	},
	clearHistory: async ({ locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const result = clearReturnedLoans(locals.user.id);
		if (result.cleared === 0) {
			return fail(400, { message: 'Na lístku nie sú vrátené knihy.' });
		}

		return { stamp: 'Vyčistené', sub: 'Vrátené zmizli z lístka' };
	}
};
