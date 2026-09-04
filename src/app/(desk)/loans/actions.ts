'use server';

import { redirect } from 'next/navigation';
import { stampDate, daysUntil } from '@/utils/format';
import { MAX_RENEWALS } from '@/catalog/hold';
import { queueLoanNotice } from '@/server/loan-mail';
import { notifyHoldReady } from '@/server/hold-mail';
import { cancelHold, listUserWaits, waitingBookIds } from '@/server/waitlist';
import {
	clearReturnedLoans,
	countActiveLoans,
	listLoans,
	MAX_ACTIVE_LOANS,
	offerReturn,
	renewLoan
} from '@/server/library';
import { getSessionReader } from '@/server/session';

export async function loadLoans() {
	const user = await getSessionReader();
	if (!user) redirect('/login');
	const [loans, activeCount, waits] = await Promise.all([
		listLoans(user.id),
		countActiveLoans(user.id),
		listUserWaits(user.id)
	]);
	const active = loans.filter((item) => !item.returnedAt);
	const history = loans.filter((item) => item.returnedAt);
	const waiting = await waitingBookIds(active.map((item) => item.book.id));
	return {
		reader: { id: user.id, name: user.name, email: user.email, role: user.role },
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
}

export async function returnLoan(formData: FormData) {
	const user = await getSessionReader();
	if (!user) redirect('/login');
	const loanId = formData.get('loanId')?.toString() ?? '';
	const open = (await listLoans(user.id)).find((item) => item.id === loanId);
	const result = await offerReturn(user.id, loanId);
	if (!result.ok) redirect('/loans');
	if (open && !result.already) {
		await queueLoanNotice({
			kind: 'inbound',
			to: user.email,
			readerName: user.name,
			bookTitle: open.book.title,
			callNumber: open.book.callNumber
		});
	}
	redirect('/loans');
}

export async function renewLoanAction(formData: FormData) {
	const user = await getSessionReader();
	if (!user) redirect('/login');
	const loanId = formData.get('loanId')?.toString() ?? '';
	const result = await renewLoan(user.id, loanId);
	if (result.ok) {
		const open = (await listLoans(user.id)).find((item) => item.id === loanId);
		if (open) {
			await queueLoanNotice({
				kind: 'renew',
				to: user.email,
				readerName: user.name,
				bookTitle: open.book.title,
				callNumber: open.book.callNumber,
				dueAt: result.dueAt
			});
		}
	}
	redirect('/loans');
}

export async function cancelWait(formData: FormData) {
	const user = await getSessionReader();
	if (!user) redirect('/login');
	const reservationId = formData.get('reservationId')?.toString() ?? '';
	const result = await cancelHold(user.id, reservationId);
	if (result.ok && result.offer) await notifyHoldReady(result.offer);
	redirect('/loans');
}

export async function clearHistory() {
	const user = await getSessionReader();
	if (!user) redirect('/login');
	await clearReturnedLoans(user.id);
	redirect('/loans');
}

export { stampDate };
