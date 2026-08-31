import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { splitReaderName } from '$lib/borrow-fields';
import { deskIssue, deskScanSchema } from '$lib/desk-fields';
import { formInt, formText } from '$lib/server/admin';
import { getBook } from '$lib/server/library';
import { queueLoanNotice } from '$lib/server/loan-mail';
import { findScanHit } from '$lib/server/desk/scan';
import { getDeskLoan, returnDeskLoan, saveLoan } from '$lib/server/desk/loans';
import { readerOptions } from '$lib/server/desk/options';

export const load: PageServerLoad = async ({ url }) => {
	const code = url.searchParams.get('code')?.trim() ?? '';
	const issue = code ? deskIssue(deskScanSchema, { code }) : undefined;
	const hit = !issue && code ? await findScanHit(code) : null;
	return {
		code,
		hit,
		readers: hit?.kind === 'borrow' ? await readerOptions() : []
	};
};

export const actions: Actions = {
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
	borrow: async ({ request }) => {
		const data = await request.formData();
		const userId = formText(data, 'userId');
		const bookId = formText(data, 'bookId');
		const days = formInt(data, 'loanDays') ?? 0;
		const result = await saveLoan({
			bookId,
			holdingId: formText(data, 'holdingId'),
			userId,
			borrowerFirstName: formText(data, 'borrowerFirstName'),
			borrowerLastName: formText(data, 'borrowerLastName'),
			borrowerClass: formText(data, 'borrowerClass'),
			loanDays: days
		});
		if (!result.ok) return fail(400, { message: result.message });
		const held = await getBook(bookId);
		const pass = (await readerOptions()).find((item) => item.id === userId);
		const dueAt = new Date(Date.now() + Math.max(days, 1) * 24 * 60 * 60 * 1000);
		if (held && pass?.email) {
			const names = splitReaderName(pass.name);
			await queueLoanNotice({
				kind: 'borrow',
				to: pass.email,
				readerName:
					`${formText(data, 'borrowerFirstName')} ${formText(data, 'borrowerLastName')}`.trim() ||
					`${names.firstName} ${names.lastName}`.trim() ||
					pass.name,
				bookTitle: held.title,
				callNumber: held.callNumber,
				dueAt,
				className: formText(data, 'borrowerClass'),
				days
			});
		}
		return { stamp: 'Vypožičané' };
	}
};
