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
import { queueLoanNotice } from '$lib/server/loan-mail';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const [loans, activeCount] = await Promise.all([
		listLoans(locals.user.id),
		countActiveLoans(locals.user.id)
	]);
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
		activeCount,
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
		const open = (await listLoans(locals.user.id)).find((item) => item.id === loanId);
		const result = await returnBook(locals.user.id, loanId);

		if (!result.ok) {
			return fail(400, { message: result.message });
		}

		if (open) {
			await queueLoanNotice({
				kind: 'return',
				to: locals.user.email,
				readerName: locals.user.name,
				bookTitle: open.book.title,
				callNumber: open.book.callNumber
			});
		}

		return { stamp: 'Vrátené', sub: stampDate(new Date()) };
	},
	clearHistory: async ({ locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const result = await clearReturnedLoans(locals.user.id);
		if (result.cleared === 0) {
			return fail(400, { message: 'Na lístku nie sú vrátené knihy.' });
		}

		return { stamp: 'Vyčistené', sub: 'Vrátené zmizli z lístka' };
	}
};
