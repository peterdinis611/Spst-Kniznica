import { csvFileStamp } from '$lib/csv';
import { stampDate } from '$lib/format';
import { inventoryXml, listInventoryRows } from '$lib/server/desk/reports';
import { xmlResponse } from '$lib/xml';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const now = new Date();
	const rows = await listInventoryRows();
	return xmlResponse(`inventura-${csvFileStamp(now)}.xml`, inventoryXml(rows, stampDate(now)));
};
