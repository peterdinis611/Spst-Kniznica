'use server';

import { redirect } from 'next/navigation';
import { canOpenDesk } from '@/server/admin-access';
import { pullClassSlip, renewClassSlip } from '@/server/desk/class-slips';
import { queueLoanNotice } from '@/server/loan-mail';
import { noticeHref } from '@/notify/notices';
import { failIfRateLimited } from '@/server/rate-limit';
import { actionEvent, getSessionReader } from '@/server/session';
import { isActionFailure } from '@/http/kit';
import { normalizeClass } from '@/desk/borrow-fields';

async function requireTeacher() {
	const user = await getSessionReader();
	if (!user) redirect('/login');
	if (!canOpenDesk(user)) redirect('/');
	const blocked = await failIfRateLimited(await actionEvent(), 'desk', {}, user.id);
	if (blocked && isActionFailure(blocked)) redirect(noticeHref('/admin', 'pace'));
	return user;
}

function classFields(formData: FormData) {
	const loanId = String(formData.get('loanId') ?? '').trim();
	const klass = normalizeClass(String(formData.get('class') ?? ''));
	return { loanId, klass };
}

function classHref(klass: string, notice: 'renew' | 'renew-fail' | 'return' | 'return-fail') {
	const path = klass ? `/admin?class=${encodeURIComponent(klass)}` : '/admin';
	return noticeHref(path, notice);
}

export async function renewClassLoan(formData: FormData) {
	const user = await requireTeacher();
	const { loanId, klass } = classFields(formData);
	const result = await renewClassSlip(user, loanId, klass);
	if (result.ok && result.kind === 'renew') {
		await queueLoanNotice({
			kind: 'renew',
			to: result.email,
			readerName: result.readerName,
			bookTitle: result.title,
			dueAt: result.dueAt
		});
		redirect(classHref(klass, 'renew'));
	}
	redirect(classHref(klass, 'renew-fail'));
}

export async function pullClassLoan(formData: FormData) {
	const user = await requireTeacher();
	const { loanId, klass } = classFields(formData);
	const result = await pullClassSlip(user, loanId, klass);
	if (result.ok && result.kind === 'pull') {
		if (!result.already) {
			await queueLoanNotice({
				kind: 'inbound',
				to: result.email,
				readerName: result.readerName,
				bookTitle: result.title
			});
		}
		redirect(classHref(klass, 'return'));
	}
	redirect(classHref(klass, 'return-fail'));
}
