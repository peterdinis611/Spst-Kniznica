import { ensureSeeded } from '@/server/db/seed';
import { warmCatalog } from '@/server/library';
import { runDeskTick } from '@/server/desk-tick';

let booted = false;
let lastTick = 0;
const TICK_EVERY_MS = 30 * 60 * 1000;

export async function ensureHall() {
	if (!booted) {
		try {
			await ensureSeeded();
			await warmCatalog();
			booted = true;
		} catch {
			// Tables may not exist until `bun run db:migrate`.
		}
	}

	if (Date.now() - lastTick >= TICK_EVERY_MS) {
		lastTick = Date.now();
		void runDeskTick().catch(() => {
			lastTick = 0;
		});
	}
}
