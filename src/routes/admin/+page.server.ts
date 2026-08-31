import type { PageServerLoad } from './$types';
import { normalizeClass } from '$lib/borrow-fields';
import { canOperateDesk } from '$lib/server/admin-access';
import { deskCounts } from '$lib/server/desk/counts';
import { countOpenClassLoans, listDeskClasses } from '$lib/server/desk/loans';
import { deskQueue, emptyDeskQueue } from '$lib/server/desk/queue';

export const load: PageServerLoad = async ({ url, locals }) => {
	const manage = canOperateDesk(locals.user);
	if (!manage) {
		const klass = normalizeClass(url.searchParams.get('class') ?? '');
		const [queue, open, classes] = await Promise.all([
			klass ? deskQueue(new Date(), klass) : Promise.resolve(emptyDeskQueue()),
			klass ? countOpenClassLoans(klass) : Promise.resolve(0),
			listDeskClasses()
		]);
		return { manage, klass, queue, open, classes, counts: null };
	}

	const [counts, queue] = await Promise.all([deskCounts(), deskQueue()]);
	return { manage, klass: '', queue, open: counts.openLoans, classes: [], counts };
};
