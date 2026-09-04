import { ensureSeeded } from '@/server/db/seed';
import { warmCatalog } from '@/server/library';
import { runDeskTick } from '@/server/desk-tick';

const TICK_EVERY_MS = 30 * 60 * 1000;

const hall = globalThis as typeof globalThis & {
	__spstBooted?: boolean;
	__spstTick?: number;
};

export async function ensureHall() {
	if (!hall.__spstBooted) {
		try {
			await ensureSeeded();
			await warmCatalog();
			hall.__spstBooted = true;
		} catch {
			// Tables may not exist until `bun run db:migrate`.
		}
	}

	const lastTick = hall.__spstTick ?? 0;
	if (Date.now() - lastTick >= TICK_EVERY_MS) {
		hall.__spstTick = Date.now();
		void runDeskTick().catch(() => {
			hall.__spstTick = 0;
		});
	}
}
