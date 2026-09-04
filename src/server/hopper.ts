import { sqlClient } from '@/server/db';
import { describeFolioJob, bossStateLabel, type FolioQueueName } from '@/server/folio-jobs';

export type HopperCounts = {
	queued: number;
	active: number;
	failed: number;
	completed: number;
	ready: boolean;
};

export type BossSlip = {
	id: string;
	name: FolioQueueName | string;
	state: string;
	title: string;
	detail: string;
	stamp: string;
	stateLabel: string;
	createdOn: Date;
	retryCount: number;
	canRetry: boolean;
	canCancel: boolean;
};

export async function hopperCounts(): Promise<HopperCounts> {
	const empty: HopperCounts = {
		queued: 0,
		active: 0,
		failed: 0,
		completed: 0,
		ready: false
	};

	try {
		const rows = await sqlClient<{ state: string; n: number }[]>`
			SELECT state::text AS state, count(*)::int AS n
			FROM pgboss.job
			GROUP BY state
		`;
		const map = Object.fromEntries(rows.map((row) => [row.state, row.n]));
		return {
			queued: (map.created ?? 0) + (map.retry ?? 0),
			active: map.active ?? 0,
			failed: map.failed ?? 0,
			completed: map.completed ?? 0,
			ready: true
		};
	} catch {
		return empty;
	}
}

export async function listBossSlips(limit = 40): Promise<BossSlip[]> {
	try {
		const rows = await sqlClient<
			{
				id: string;
				name: string;
				state: string;
				data: unknown;
				created_on: Date;
				retry_count: number;
			}[]
		>`
			SELECT id::text, name, state::text, data, created_on, retry_count
			FROM pgboss.job
			ORDER BY created_on DESC
			LIMIT ${limit}
		`;

		return rows.map((row) => {
			const copy = describeFolioJob(row.name, row.data);
			return {
				id: row.id,
				name: row.name,
				state: row.state,
				title: copy.title,
				detail: copy.detail,
				stamp: copy.stamp,
				stateLabel: bossStateLabel(row.state),
				createdOn: row.created_on,
				retryCount: row.retry_count,
				canRetry: row.state === 'failed' || row.state === 'cancelled',
				canCancel: row.state === 'created' || row.state === 'retry' || row.state === 'active'
			};
		});
	} catch {
		return [];
	}
}
