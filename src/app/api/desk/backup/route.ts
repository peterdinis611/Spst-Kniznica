import { readFile } from 'node:fs/promises';
import { canOperateDesk } from '@/server/admin-access';
import { folioBackupFile } from '@/server/folio-backup';
import { getSessionReader } from '@/server/session';

export async function GET(request: Request) {
	const user = await getSessionReader();
	if (!user || !canOperateDesk(user)) {
		return new Response('Záloha je len pre knihovníka.', { status: 403 });
	}

	const file = new URL(request.url).searchParams.get('file') ?? '';
	const dest = folioBackupFile(file);
	if (!dest) return new Response('Taký odpis nie je.', { status: 400 });

	try {
		const buf = await readFile(dest);
		return new Response(buf, {
			headers: {
				'content-type': 'application/sql; charset=utf-8',
				'content-disposition': `attachment; filename="${file}"`,
				'cache-control': 'no-store'
			}
		});
	} catch {
		return new Response('Odpis som nenašiel.', { status: 404 });
	}
}
