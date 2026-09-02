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
import {
	closeInventoryRun,
	getOpenInventoryRun,
	markHoldingFound,
	markHoldingLost,
	openInventoryRun
} from '$lib/server/desk/inventory';

function scanMode(raw: string | null) {
	return raw === 'inventura' ? 'inventura' : 'pult';
}

export const load: PageServerLoad = async ({ url }) => {
	const code = url.searchParams.get('code')?.trim() ?? '';
	const mode = scanMode(url.searchParams.get('mode'));
	const issue = code ? deskIssue(deskScanSchema, { code }) : undefined;
	const hit = !issue && code ? await findScanHit(code) : null;
	const walk = mode === 'inventura' ? await getOpenInventoryRun() : null;
	return {
		code,
		mode,
		hit,
		walk,
		readers: hit?.kind === 'borrow' && mode === 'pult' ? await readerOptions() : []
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
	},
	openWalk: async () => {
		await openInventoryRun();
		return { stamp: 'Inventúra otvorená' };
	},
	closeWalk: async () => {
		const result = await closeInventoryRun();
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: result.missing ? `Uzavreté · ${result.missing} chýba` : 'Inventúra uzavretá' };
	},
	found: async ({ request }) => {
		const id = formText(await request.formData(), 'holdingId');
		const result = await markHoldingFound(id);
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Nájdený' };
	},
	lost: async ({ request }) => {
		const id = formText(await request.formData(), 'holdingId');
		const result = await markHoldingLost(id);
		if (!result.ok) return fail(400, { message: result.message });
		return { stamp: 'Stratený' };
	}
};
