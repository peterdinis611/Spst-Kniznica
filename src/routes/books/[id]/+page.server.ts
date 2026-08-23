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

export const load: PageServerLoad = async ({ params, locals }) => {
	const current = getBook(params.id);
	if (!current) error(404, 'Karta v katalógu chýba.');

	const userLoan = locals.user ? getActiveLoan(locals.user.id, current.id) : null;
	const activeCount = locals.user ? countActiveLoans(locals.user.id) : 0;
	const lastBorrower = locals.user ? getLastBorrower(locals.user.id) : null;
	const fromName = locals.user ? splitReaderName(locals.user.name) : { firstName: '', lastName: '' };

	return {
		book: current,
		related: relatedBookSlips(current.id, current.category.id),
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

		const result = borrowBook(locals.user.id, params.id, {
			firstName: values.firstName.trim(),
			lastName: values.lastName.trim(),
			className: normalizeClass(values.className),
			days
		});
		if (!result.ok) {
			return fail(400, { message: result.message, errors: {}, values });
		}

		return { stamp: 'Vypožičané', sub: stampDate(result.dueAt) };
	}
};
