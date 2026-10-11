import { canOperateDesk } from '@/server/admin-access';
import { overdueCsv } from '@/desk/desk-export';
import { listOverdueRows } from '@/server/desk/reports';
import { getSessionReader } from '@/server/session';
import { csvFileStamp, csvResponse } from '@/utils/csv';

export async function GET() {
	const user = await getSessionReader();
	if (!user || !canOperateDesk(user)) {
		return new Response('Výkaz je len pre knihovníka.', { status: 403 });
	}
	const rows = await listOverdueRows();
	return csvResponse(`po-lehote-${csvFileStamp()}.csv`, overdueCsv(rows));
}
