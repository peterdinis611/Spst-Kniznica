'use server';

import { redirect } from 'next/navigation';
import * as v from 'valibot';
import { authActionClient } from '@/http/safe-action';
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
import { listOpenBookOrders } from '@/server/book-order';
import { getSessionReader } from '@/server/session';
import { noticeHref } from '@/notify/notices';

const loanIdSchema = v.object({
	loanId: v.pipe(v.string(), v.minLength(1))
});

const reservationIdSchema = v.object({
	reservationId: v.pipe(v.string(), v.minLength(1))
});

export async function loadLoans() {
	const user = await getSessionReader();
	if (!user) redirect('/login');
	const [loans, activeCount, waits, orders] = await Promise.all([
		listLoans(user.id),
		countActiveLoans(user.id),
		listUserWaits(user.id),
		listOpenBookOrders(user.id)
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
		orders,
		activeCount,
		maxLoans: MAX_ACTIVE_LOANS
	};
}

export const returnLoan = authActionClient
	.inputSchema(loanIdSchema)
	.action(async ({ parsedInput, ctx }) => {
		const { user } = ctx;
		const loanId = parsedInput.loanId;
		const open = (await listLoans(user.id)).find((item) => item.id === loanId);
		const result = await offerReturn(user.id, loanId);
		if (!result.ok) redirect(noticeHref('/loans', 'return-fail'));
		if (open && !result.already) {
			await queueLoanNotice({
				kind: 'inbound',
				to: user.email,
				readerName: user.name,
				bookTitle: open.book.title,
				callNumber: open.book.callNumber
			});
		}
		redirect(noticeHref('/loans', 'return'));
	});

export const renewLoanAction = authActionClient
	.inputSchema(loanIdSchema)
	.action(async ({ parsedInput, ctx }) => {
		const { user } = ctx;
		const loanId = parsedInput.loanId;
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
			redirect(noticeHref('/loans', 'renew'));
		}
		redirect(noticeHref('/loans', 'renew-fail'));
	});

export const cancelWait = authActionClient
	.inputSchema(reservationIdSchema)
	.action(async ({ parsedInput, ctx }) => {
		const result = await cancelHold(ctx.user.id, parsedInput.reservationId);
		if (result.ok && result.offer) await notifyHoldReady(result.offer);
		redirect(noticeHref('/loans', 'wait-cancel'));
	});

export const clearHistory = authActionClient.inputSchema(v.object({})).action(async ({ ctx }) => {
	await clearReturnedLoans(ctx.user.id);
	redirect(noticeHref('/loans', 'history-clear'));
});

export { stampDate };
