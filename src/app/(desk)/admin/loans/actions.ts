'use server';

import { revalidatePath } from 'next/cache';
import { formDate, formInt, formText } from '@/server/admin';
import { drawerRedirect, requireLibrarian } from '@/server/desk-actions';
import { deleteLoan, getDeskLoan, returnDeskLoan, saveLoan } from '@/server/desk/loans';
import { queueLoanNotice } from '@/server/loan-mail';

const PATH = '/admin/loans';

export async function saveLoanAction(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await saveLoan({
		id: formText(formData, 'id') || undefined,
		bookId: formText(formData, 'bookId'),
		holdingId: formText(formData, 'holdingId'),
		userId: formText(formData, 'userId'),
		borrowerFirstName: formText(formData, 'borrowerFirstName'),
		borrowerLastName: formText(formData, 'borrowerLastName'),
		borrowerClass: formText(formData, 'borrowerClass'),
		loanDays: formInt(formData, 'loanDays') ?? 21,
		borrowedAt: formDate(formData, 'borrowedAt'),
		dueAt: formDate(formData, 'dueAt'),
		returnedAt: formDate(formData, 'returnedAt'),
		renewalCount: formInt(formData, 'renewalCount') ?? 0
	});
	revalidatePath(PATH);
	if (!result.ok) drawerRedirect(PATH, { q, fault: result.message });
	drawerRedirect(PATH, { q, stamp: 'ok' });
}

export async function returnLoanAction(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const id = formText(formData, 'id');
	const current = await getDeskLoan(id);
	const result = await returnDeskLoan(id);
	revalidatePath(PATH);
	if (!result.ok) drawerRedirect(PATH, { q, fault: result.message });
	if (current?.readerEmail) {
		await queueLoanNotice({
			kind: 'return',
			to: current.readerEmail,
			readerName: current.readerName,
			bookTitle: current.bookTitle
		});
	}
	drawerRedirect(PATH, { q, stamp: 'return' });
}

export async function deleteLoanAction(formData: FormData) {
	await requireLibrarian(PATH);
	const q = formText(formData, 'q');
	const result = await deleteLoan(formText(formData, 'id'));
	revalidatePath(PATH);
	if (!result.ok) drawerRedirect(PATH, { q, fault: result.message });
	drawerRedirect(PATH, { q, stamp: 'gone' });
}
