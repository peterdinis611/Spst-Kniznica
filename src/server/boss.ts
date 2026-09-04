import type { PgBoss } from 'pg-boss';
import { env } from '@/config/env';
import { FOLIO_QUEUES, handleMailJob, isFolioQueue, type FolioMailJob } from '@/server/folio-jobs';

export { FOLIO_QUEUES, isFolioQueue };

type Hall = typeof globalThis & {
	__spstBoss?: Promise<PgBoss>;
};

const hall = globalThis as Hall;

function vitestRun() {
	return Boolean(process.env.VITEST);
}

export function getBoss() {
	if (!hall.__spstBoss) {
		hall.__spstBoss = bootBoss().catch((err) => {
			hall.__spstBoss = undefined;
			throw err;
		});
	}
	return hall.__spstBoss;
}

export function startBoss() {
	return getBoss();
}

async function bootBoss() {
	const connectionString = env.DATABASE_URL?.trim();
	if (!connectionString) throw new Error('DATABASE_URL is not set');

	const { PgBoss } = await import('pg-boss');
	const boss = new PgBoss({
		connectionString,
		schema: 'pgboss',
		max: 2,
		application_name: 'spst-kniznica',
		createSchema: true,
		migrate: true,
		schedule: true
	});

	boss.on('error', (err) => {
		console.error('[pg-boss]', err);
	});

	await boss.start();
	await ensureQueue(boss, FOLIO_QUEUES.mail, {
		policy: 'standard',
		retryLimit: 5,
		retryDelay: 30,
		retryBackoff: true,
		expireInSeconds: 3600,
		deleteAfterSeconds: 14 * 24 * 60 * 60
	});
	await ensureQueue(boss, FOLIO_QUEUES.tick, {
		policy: 'singleton',
		retryLimit: 2,
		expireInSeconds: 600,
		deleteAfterSeconds: 7 * 24 * 60 * 60
	});

	await boss.work<FolioMailJob>(
		FOLIO_QUEUES.mail,
		{ localConcurrency: 2, pollingIntervalSeconds: 2 },
		async ([job]) => {
			if (!job) return;
			await handleMailJob(job.data);
		}
	);

	await boss.work(
		FOLIO_QUEUES.tick,
		{ localConcurrency: 1, pollingIntervalSeconds: 5 },
		async () => {
			const { runDeskTick } = await import('@/server/desk-tick');
			await runDeskTick();
		}
	);

	const scheduled = await boss.getSchedules(FOLIO_QUEUES.tick);
	if (scheduled.length === 0) {
		await boss.schedule(
			FOLIO_QUEUES.tick,
			'*/30 * * * *',
			{ kind: 'tick' },
			{
				tz: 'Europe/Bratislava',
				key: 'desk-tick',
				singletonKey: 'desk-tick',
				singletonSeconds: 1700
			}
		);
	}

	return boss;
}

async function ensureQueue(
	boss: PgBoss,
	name: string,
	options: NonNullable<Parameters<PgBoss['createQueue']>[1]>
) {
	try {
		const existing = await boss.getQueue(name);
		if (existing) return;
	} catch {
		// Schema is fresh or the drawer is missing.
	}
	try {
		await boss.createQueue(name, options);
	} catch (err) {
		const msg = err instanceof Error ? err.message : '';
		if (!/already exists|duplicate/i.test(msg)) throw err;
	}
}

export async function enqueueFolioMail(job: FolioMailJob) {
	if (vitestRun()) return handleMailJob(job);

	try {
		const boss = await getBoss();
		const id = await boss.send(FOLIO_QUEUES.mail, job);
		if (!id) return handleMailJob(job);
		return { ok: true as const, queued: true, id };
	} catch (err) {
		console.error('[folio-mail] zásobník nedostupný, posielam hneď', err);
		return handleMailJob(job);
	}
}

export async function enqueueDeskTick(force = false) {
	const boss = await getBoss();
	return boss.send(
		FOLIO_QUEUES.tick,
		{ kind: 'tick', at: new Date().toISOString() },
		force ? { priority: 10 } : { singletonKey: 'desk-tick', singletonSeconds: 1700 }
	);
}

export async function retryBossJob(name: string, id: string) {
	if (!isFolioQueue(name) || !id) return { ok: false as const };
	const boss = await getBoss();
	await boss.retry(name, id);
	return { ok: true as const };
}

export async function cancelBossJob(name: string, id: string) {
	if (!isFolioQueue(name) || !id) return { ok: false as const };
	const boss = await getBoss();
	await boss.cancel(name, id);
	return { ok: true as const };
}
