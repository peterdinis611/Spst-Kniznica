'use server';

import { redirect } from 'next/navigation';
import { canOperateDesk } from '@/server/admin-access';
import { noticeHref } from '@/notify/notices';
import { failIfRateLimited } from '@/server/rate-limit';
import { actionEvent, getSessionReader } from '@/server/session';
import { isActionFailure } from '@/http/kit';

export async function requireLibrarian(pacePath = '/admin') {
	const user = await getSessionReader();
	if (!user) redirect('/login');
	if (!canOperateDesk(user)) redirect('/admin');
	const blocked = await failIfRateLimited(await actionEvent(), 'desk', {}, user.id);
	if (blocked && isActionFailure(blocked)) redirect(noticeHref(pacePath, 'pace'));
	return user;
}

export function drawerRedirect(
	path: string,
	opts: { edit?: string | null; q?: string; stamp?: string; fault?: string } = {}
): never {
	const params = new URLSearchParams();
	if (opts.q) params.set('q', opts.q);
	if (opts.edit) params.set('edit', opts.edit);
	if (opts.stamp) params.set('stamp', opts.stamp);
	if (opts.fault) params.set('fault', opts.fault);
	const query = params.toString();
	redirect(query ? `${path}?${query}` : path);
}
