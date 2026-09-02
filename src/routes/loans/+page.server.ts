import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	clearReturnedLoans,
	countActiveLoans,
	listLoans,
	MAX_ACTIVE_LOANS,
	offerReturn,
	renewLoan
} from '$lib/server/library';
import { stampDate, daysUntil } from '$lib/format';
import { MAX_RENEWALS } from '$lib/hold';
import { queueLoanNotice } from '$lib/server/loan-mail';
import { notifyHoldReady } from '$lib/server/hold-mail';
import { cancelHold, listUserWaits, waitingBookIds } from '$lib/server/waitlist';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const [loans, activeCount, waits] = await Promise.all([
		listLoans(locals.user.id),
		countActiveLoans(locals.user.id),
		listUserWaits(locals.user.id)
	]);
	const active = loans.filter((item) => !item.returnedAt);
	const history = loans.filter((item) => item.returnedAt);
	const waiting = await waitingBookIds(active.map((item) => item.book.id));

	return {
		reader: {
			id: locals.user.id,
			name: locals.user.name,
			email: locals.user.email,
			role: locals.user.role
		},
		loans: active.map((item) => ({
			...item,
			canRenew:
				item.renewalCount < MAX_RENEWALS &&
				daysUntil(item.dueAt) >= 0 &&
				!waiting.has(item.book.id) &&
				!item.returnOfferedAt
		})),
		history,
		waits,
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
		const result = await offerReturn(locals.user.id, loanId);

		if (!result.ok) {
			return fail(400, { message: result.message });
		}

		if (open && !result.already) {
			await queueLoanNotice({
				kind: 'inbound',
				to: locals.user.email,
				readerName: locals.user.name,
				bookTitle: open.book.title,
				callNumber: open.book.callNumber
			});
		}

		return { stamp: 'Na pult', sub: stampDate(new Date()) };
	},
	renew: async ({ locals, request }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const loanId = (await request.formData()).get('loanId')?.toString() ?? '';
		const open = (await listLoans(locals.user.id)).find((item) => item.id === loanId);
		const result = await renewLoan(locals.user.id, loanId);
		if (!result.ok) {
			return fail(400, { message: result.message });
		}

		if (open) {
			await queueLoanNotice({
				kind: 'renew',
				to: locals.user.email,
				readerName: locals.user.name,
				bookTitle: open.book.title,
				callNumber: open.book.callNumber,
				dueAt: result.dueAt,
				days: open.loanDays
			});
		}

		return { stamp: 'Predĺžené', sub: stampDate(result.dueAt) };
	},
	cancelWait: async ({ locals, request }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const reservationId = (await request.formData()).get('reservationId')?.toString() ?? '';
		const result = await cancelHold(locals.user.id, reservationId);
		if (!result.ok) {
			return fail(400, { message: result.message });
		}

		if (result.offer) await notifyHoldReady(result.offer);
		return { stamp: 'Stiahnuté', sub: 'Čakací lístok zmizol' };
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
