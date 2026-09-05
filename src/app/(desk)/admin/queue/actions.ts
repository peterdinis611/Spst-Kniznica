'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { canOperateDesk } from '@/server/admin-access';
import { cancelBossJob, retryBossJob } from '@/server/boss';
import { runDeskTick } from '@/server/desk-tick';
import { isFolioQueue } from '@/server/folio-jobs';
import { noticeHref } from '@/notify/notices';
import { failIfRateLimited } from '@/server/rate-limit';
import { actionEvent, getSessionReader } from '@/server/session';
import { isActionFailure } from '@/http/kit';

async function requireLibrarian() {
	const user = await getSessionReader();
	if (!user) redirect('/login');
	if (!canOperateDesk(user)) redirect('/admin');
	const blocked = await failIfRateLimited(await actionEvent(), 'desk', {}, user.id);
	if (blocked && isActionFailure(blocked)) redirect(noticeHref('/admin/queue', 'pace'));
	return user;
}

function jobFields(formData: FormData) {
	const id = String(formData.get('id') ?? '').trim();
	const name = String(formData.get('name') ?? '').trim();
	if (!id || !isFolioQueue(name)) return null;
	return { id, name };
}

export async function retryQueueJob(formData: FormData) {
	await requireLibrarian();
	const job = jobFields(formData);
	if (job) await retryBossJob(job.name, job.id);
	revalidatePath('/admin/queue');
}

export async function cancelQueueJob(formData: FormData) {
	await requireLibrarian();
	const job = jobFields(formData);
	if (job) await cancelBossJob(job.name, job.id);
	revalidatePath('/admin/queue');
}

export async function runQueueTick() {
	await requireLibrarian();
	const report = await runDeskTick();
	const q = new URLSearchParams({
		tik: '1',
		soon: String(report.dueSoon),
		late: String(report.overdue),
		holds: String(report.holds)
	});
	redirect(`/admin/queue?${q.toString()}`);
}
