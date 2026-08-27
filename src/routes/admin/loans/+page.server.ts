import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formDate, formInt, formText } from '$lib/server/admin';
import { pickCurrent } from '$lib/pult-ledger';
import { getBook } from '$lib/server/library';
import { queueLoanNotice } from '$lib/server/loan-mail';
import { deleteLoan, getDeskLoan, listDeskLoans, returnDeskLoan, saveLoan } from '$lib/server/desk/loans';
import { bookOptions, readerOptions } from '$lib/server/desk/options';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const edit = url.searchParams.get('edit') ?? '';
	const rows = await listDeskLoans(q);
	const current = await pickCurrent(rows, edit, getDeskLoan);
	const [books, readers] = await Promise.all([bookOptions(), readerOptions()]);
	return { q, rows, current, books, readers };
};

export const actions: Actions = {
	save: async ({ request }) => {
		const data = await request.formData();
		const userId = formText(data, 'userId');
		const bookId = formText(data, 'bookId');
		const isNew = !formText(data, 'id');
		const days = formInt(data, 'loanDays') ?? 0;
		const result = await saveLoan({
			id: formText(data, 'id') || undefined,
			bookId,
			holdingId: formText(data, 'holdingId'),
			userId,
			borrowerFirstName: formText(data, 'borrowerFirstName'),
			borrowerLastName: formText(data, 'borrowerLastName'),
			borrowerClass: formText(data, 'borrowerClass'),
			loanDays: days,
			borrowedAt: formDate(data, 'borrowedAt'),
			dueAt: formDate(data, 'dueAt'),
			returnedAt: formDate(data, 'returnedAt'),
			renewalCount: formInt(data, 'renewalCount') ?? 0
		});
		if (!result.ok) return fail(400, { message: result.message });
		if (isNew) {
			const held = await getBook(bookId);
			const pass = (await readerOptions()).find((item) => item.id === userId);
			const dueAt =
				formDate(data, 'dueAt') ??
				new Date(Date.now() + Math.max(days, 1) * 24 * 60 * 60 * 1000);
			if (held && pass?.email) {
				await queueLoanNotice({
					kind: 'borrow',
					to: pass.email,
					readerName: `${formText(data, 'borrowerFirstName')} ${formText(data, 'borrowerLastName')}`.trim() ||
						pass.name,
					bookTitle: held.title,
					callNumber: held.callNumber,
					dueAt,
					className: formText(data, 'borrowerClass'),
					days
				});
			}
		}
		return { stamp: 'Uložené' };
	},
	return: async ({ request }) => {
		const data = await request.formData();
		const id = formText(data, 'id');
		const current = await getDeskLoan(id);
		const result = await returnDeskLoan(id);
		if (!result.ok) return fail(400, { message: result.message });
		if (current?.readerEmail) {
			await queueLoanNotice({
				kind: 'return',
				to: current.readerEmail,
				readerName: current.readerName,
				bookTitle: current.bookTitle
			});
		}
		return { stamp: 'Vrátené' };
	},
	delete: async ({ request }) => {
		const data = await request.formData();
		const result = await deleteLoan(formText(data, 'id'));
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Zmazané' };
	}
};
