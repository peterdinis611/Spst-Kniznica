import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	borrowBook,
	getActiveLoan,
	getBook,
	getLastBorrower,
	countActiveLoans,
	MAX_ACTIVE_LOANS,
	relatedBookSlips
} from '$lib/server/library';
import {
	hasBorrowErrors,
	normalizeClass,
	parseLoanDays,
	splitReaderName,
	validateBorrow
} from '$lib/borrow-fields';
import { stampDate } from '$lib/format';
import { queueLoanNotice } from '$lib/server/loan-mail';

export const load: PageServerLoad = async ({ params, locals }) => {
	const current = await getBook(params.id);
	if (!current) error(404, 'Karta v katalógu chýba.');

	const [userLoan, activeCount, lastBorrower, related] = await Promise.all([
		locals.user ? getActiveLoan(locals.user.id, current.id) : null,
		locals.user ? countActiveLoans(locals.user.id) : 0,
		locals.user ? getLastBorrower(locals.user.id) : null,
		relatedBookSlips(current.id, current.category.id)
	]);
	const fromName = locals.user ? splitReaderName(locals.user.name) : { firstName: '', lastName: '' };

	return {
		book: current,
		related,
		userLoan,
		activeCount,
		maxLoans: MAX_ACTIVE_LOANS,
		borrower: lastBorrower ?? {
			firstName: fromName.firstName,
			lastName: fromName.lastName,
			className: '',
			days: 21
		}
	};
};

export const actions: Actions = {
	borrow: async ({ locals, params, request }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const formData = await request.formData();
		const values = {
			firstName: formData.get('firstName')?.toString() ?? '',
			lastName: formData.get('lastName')?.toString() ?? '',
			className: formData.get('className')?.toString() ?? '',
			days: formData.get('days')?.toString() ?? ''
		};
		const errors = validateBorrow(values);
		if (hasBorrowErrors(errors)) {
			return fail(400, { message: 'Doplň výpožičný lístok.', errors, values });
		}

		const days = parseLoanDays(values.days);
		if (!days) {
			return fail(400, { message: 'Vyber dobu výpožičky.', errors, values });
		}

		const result = await borrowBook(locals.user.id, params.id, {
			firstName: values.firstName.trim(),
			lastName: values.lastName.trim(),
			className: normalizeClass(values.className),
			days
		});
		if (!result.ok) {
			return fail(400, { message: result.message, errors: {}, values });
		}

		const held = await getBook(params.id);
		await queueLoanNotice({
			kind: 'borrow',
			to: locals.user.email,
			readerName: `${values.firstName.trim()} ${values.lastName.trim()}`.trim() || locals.user.name,
			bookTitle: held?.title ?? 'Zväzok',
			callNumber: held?.callNumber,
			dueAt: result.dueAt,
			className: normalizeClass(values.className),
			days
		});

		return { stamp: 'Vypožičané', sub: stampDate(result.dueAt) };
	}
};
