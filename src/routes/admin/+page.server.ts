import type { PageServerLoad } from './$types';
import { deskCounts } from '$lib/server/desk/counts';
import { deskQueue } from '$lib/server/desk/queue';

export const load: PageServerLoad = async () => {
	const [counts, queue] = await Promise.all([deskCounts(), deskQueue()]);
	return { counts, queue };
};
