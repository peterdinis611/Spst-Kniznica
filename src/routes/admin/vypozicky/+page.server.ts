import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formDate, formInt, formText } from '$lib/server/admin';
import {
	bookOptions,
	deleteLoan,
	listDeskLoans,
	readerOptions,
	returnDeskLoan,
	saveLoan
} from '$lib/server/admin-desk';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const edit = url.searchParams.get('edit') ?? '';
	const rows = listDeskLoans(q);
	const current = rows.find((row) => row.id === edit) ?? null;
	return { q, rows, current, books: bookOptions(), readers: readerOptions() };
};

export const actions: Actions = {
	save: async ({ request }) => {
		const data = await request.formData();
		const result = saveLoan({
			id: formText(data, 'id') || undefined,
			bookId: formText(data, 'bookId'),
			holdingId: formText(data, 'holdingId'),
			userId: formText(data, 'userId'),
			borrowerFirstName: formText(data, 'borrowerFirstName'),
			borrowerLastName: formText(data, 'borrowerLastName'),
			borrowerClass: formText(data, 'borrowerClass'),
			loanDays: formInt(data, 'loanDays') ?? 0,
			borrowedAt: formDate(data, 'borrowedAt'),
			dueAt: formDate(data, 'dueAt'),
			returnedAt: formDate(data, 'returnedAt'),
			renewalCount: formInt(data, 'renewalCount') ?? 0
		});
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Uložené' };
	},
	return: async ({ request }) => {
		const data = await request.formData();
		const result = returnDeskLoan(formText(data, 'id'));
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Vrátené' };
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const result = deleteLoan(formText(data, 'id'));
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Zmazané' };
	}
};
