import { csvFileStamp } from '$lib/csv';
import { stampDate } from '$lib/format';
import { listOverdueRows, overdueXml } from '$lib/server/desk/reports';
import { xmlResponse } from '$lib/xml';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const now = new Date();
	const rows = await listOverdueRows(now);
	return xmlResponse(`po-lehote-${csvFileStamp(now)}.xml`, overdueXml(rows, stampDate(now)));
};
