import { csvFileStamp, csvResponse } from '$lib/csv';
import { listOverdueRows, overdueCsv } from '$lib/server/desk/reports';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const rows = await listOverdueRows();
	return csvResponse(`po-lehote-${csvFileStamp()}.csv`, overdueCsv(rows));
};
