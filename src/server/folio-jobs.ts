import type { LoanNotice } from '@/server/loan-mail';
import type { HoldNotice } from '@/server/hold-mail';
import type { ClassDigest } from '@/server/teacher-mail';

export const FOLIO_QUEUES = {
	mail: 'folio-mail',
	tick: 'desk-tick'
} as const;

export type FolioQueueName = (typeof FOLIO_QUEUES)[keyof typeof FOLIO_QUEUES];

export type FolioMailJob =
	| { kind: 'loan'; notice: LoanNotice }
	| { kind: 'hold'; notice: HoldNotice }
	| { kind: 'class'; digest: ClassDigest };

export type FolioTickJob = { kind: 'tick'; at?: string };

export type FolioJob = FolioMailJob | FolioTickJob;

export function isFolioQueue(name: string): name is FolioQueueName {
	return name === FOLIO_QUEUES.mail || name === FOLIO_QUEUES.tick;
}

export function bossStateLabel(state: string) {
	if (state === 'created' || state === 'retry') return 'čaká';
	if (state === 'active') return 'beží';
	if (state === 'completed') return 'hotovo';
	if (state === 'failed') return 'zlyhalo';
	if (state === 'cancelled') return 'zrušené';
	return state;
}

export function describeFolioJob(name: string, data: unknown) {
	if (name === FOLIO_QUEUES.tick) {
		return { title: 'Tik pultu', detail: 'lehoty, holdy, triedy', stamp: 'tik' };
	}

	const job = asMailJob(data);
	if (!job) return { title: name, detail: 'lístok', stamp: 'fronta' };

	if (job.kind === 'loan') {
		const stamps: Record<LoanNotice['kind'], string> = {
			borrow: 'výpožička',
			return: 'vrátenie',
			inbound: 'cestou',
			renew: 'predĺženie',
			dueChanged: 'termín',
			dueSoon: 'zajtra',
			overdue: 'po lehote'
		};
		return {
			title: job.notice.bookTitle.trim() || 'Zväzok',
			detail: [job.notice.readerName, job.notice.callNumber].filter(Boolean).join(' · '),
			stamp: stamps[job.notice.kind]
		};
	}

	if (job.kind === 'hold') {
		const stamps: Record<HoldNotice['kind'], string> = {
			queued: 'čaká',
			ready: 'na pulte',
			expireSoon: 'vyprší',
			expired: 'vypršalo',
			cancelled: 'zrušené'
		};
		return {
			title: job.notice.bookTitle.trim() || 'Zväzok',
			detail: [job.notice.readerName, job.notice.callNumber].filter(Boolean).join(' · '),
			stamp: stamps[job.notice.kind]
		};
	}

	return {
		title: job.digest.className.trim() || 'Trieda',
		detail: `${job.digest.open} vonku · ${job.digest.teacherName}`.trim(),
		stamp: 'trieda'
	};
}

export async function handleMailJob(job: FolioMailJob) {
	const result =
		job.kind === 'loan'
			? await (await import('@/server/loan-mail')).sendLoanNotice(job.notice)
			: job.kind === 'hold'
				? await (await import('@/server/hold-mail')).sendHoldNotice(job.notice)
				: await (await import('@/server/teacher-mail')).sendClassDigest(job.digest);

	if (!result.ok && !result.skipped) {
		throw new Error('List z pultu neprešiel.');
	}

	return result;
}

function asMailJob(data: unknown): FolioMailJob | null {
	if (!data || typeof data !== 'object' || !('kind' in data)) return null;
	const kind = (data as { kind?: unknown }).kind;
	if (kind === 'loan' && 'notice' in data) return data as FolioMailJob;
	if (kind === 'hold' && 'notice' in data) return data as FolioMailJob;
	if (kind === 'class' && 'digest' in data) return data as FolioMailJob;
	return null;
}
