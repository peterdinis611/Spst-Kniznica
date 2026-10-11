'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { splitReaderName } from '@/desk/borrow-fields';
import { formInt, formText } from '@/server/admin';
import { requireLibrarian } from '@/server/desk-actions';
import {
	closeInventoryRun,
	markHoldingFound,
	markHoldingLost,
	openInventoryRun
} from '@/server/desk/inventory';
import { getDeskLoan, returnDeskLoan, saveLoan } from '@/server/desk/loans';
import { readerOptions } from '@/server/desk/options';
import { queueLoanNotice } from '@/server/loan-mail';
import { getBook } from '@/server/library';

const PATH = '/admin/scan';

function scanRedirect(opts: { q?: string; mode?: string; stamp?: string; fault?: string }): never {
	const params = new URLSearchParams();
	if (opts.q) params.set('q', opts.q);
	if (opts.mode) params.set('mode', opts.mode);
	if (opts.stamp) params.set('stamp', opts.stamp);
	if (opts.fault) params.set('fault', opts.fault);
	const query = params.toString();
	redirect(query ? `${PATH}?${query}` : PATH);
}

export async function scanBorrow(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const userId = formText(formData, 'userId');
	const bookId = formText(formData, 'bookId');
	const days = formInt(formData, 'loanDays') ?? 21;
	const result = await saveLoan({
		bookId,
		holdingId: formText(formData, 'holdingId'),
		userId,
		borrowerFirstName: formText(formData, 'borrowerFirstName'),
		borrowerLastName: formText(formData, 'borrowerLastName'),
		borrowerClass: formText(formData, 'borrowerClass'),
		loanDays: days
	});
	revalidatePath(PATH);
	if (!result.ok) scanRedirect({ q, fault: result.message });

	const held = await getBook(bookId);
	const pass = (await readerOptions()).find((item) => item.id === userId);
	const dueAt = new Date(Date.now() + Math.max(days, 1) * 24 * 60 * 60 * 1000);
	if (held && pass?.email) {
		const names = splitReaderName(pass.name);
		await queueLoanNotice({
			kind: 'borrow',
			to: pass.email,
			readerName:
				`${formText(formData, 'borrowerFirstName')} ${formText(formData, 'borrowerLastName')}`.trim() ||
				`${names.firstName} ${names.lastName}`.trim() ||
				pass.name,
			bookTitle: held.title,
			callNumber: held.callNumber,
			dueAt,
			className: formText(formData, 'borrowerClass'),
			days
		});
	}
	scanRedirect({ stamp: 'borrow' });
}

export async function scanReturn(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const id = formText(formData, 'id');
	const current = await getDeskLoan(id);
	const result = await returnDeskLoan(id);
	revalidatePath(PATH);
	if (!result.ok) scanRedirect({ q, fault: result.message });
	if (current?.readerEmail) {
		await queueLoanNotice({
			kind: 'return',
			to: current.readerEmail,
			readerName: current.readerName,
			bookTitle: current.bookTitle
		});
	}
	scanRedirect({ stamp: 'return' });
}

export async function scanOpenWalk() {
	await requireLibrarian(PATH);
	await openInventoryRun();
	revalidatePath(PATH);
	scanRedirect({ mode: 'inventura', stamp: 'walk' });
}

export async function scanCloseWalk() {
	await requireLibrarian(PATH);
	const result = await closeInventoryRun();
	revalidatePath(PATH);
	if (!result.ok) scanRedirect({ mode: 'inventura', fault: result.message });
	scanRedirect({ mode: 'inventura', stamp: 'closed' });
}

export async function scanFound(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await markHoldingFound(formText(formData, 'holdingId'));
	revalidatePath(PATH);
	if (!result.ok) scanRedirect({ q, mode: 'inventura', fault: result.message });
	scanRedirect({ mode: 'inventura', stamp: 'found' });
}

export async function scanLost(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await markHoldingLost(formText(formData, 'holdingId'));
	revalidatePath(PATH);
	if (!result.ok) scanRedirect({ q, mode: 'inventura', fault: result.message });
	scanRedirect({ mode: 'inventura', stamp: 'lost' });
}
