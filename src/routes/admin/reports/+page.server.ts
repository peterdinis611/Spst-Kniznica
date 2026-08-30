import type { PageServerLoad } from './$types';
import { catalogDate } from '$lib/format';
import { listInventoryRows, listOverdueRows } from '$lib/server/desk/reports';

export const load: PageServerLoad = async () => {
	const now = new Date();
	const [inventory, overdue] = await Promise.all([listInventoryRows(), listOverdueRows(now)]);
	return {
		stamp: catalogDate(now),
		inventory,
		overdue
	};
};
