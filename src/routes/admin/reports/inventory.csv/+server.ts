import { csvFileStamp, csvResponse } from '$lib/csv';
import { inventoryCsv, listInventoryRows } from '$lib/server/desk/reports';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const rows = await listInventoryRows();
	return csvResponse(`inventura-${csvFileStamp()}.csv`, inventoryCsv(rows));
};
