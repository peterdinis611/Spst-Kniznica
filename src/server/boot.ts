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
		void stampDeskTick().catch(() => {
			hall.__spstTick = 0;
		});
	}
}

async function stampDeskTick() {
	try {
		const { enqueueDeskTick } = await import('@/server/boss');
		const id = await enqueueDeskTick();
		if (id) return;
	} catch {
		// Zásobník ešte nie je — tik ide hneď, ako doteraz.
	}
	await runDeskTick();
}
