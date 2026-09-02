export type InventorySight = 'found' | 'missing' | 'out' | 'lost' | 'withdrawn';

export const INVENTORY_SIGHT_LABEL: Record<InventorySight, string> = {
	found: 'nájdený',
	missing: 'chýba',
	out: 'vonku',
	lost: 'stratený',
	withdrawn: 'vyradený'
};

export function inventorySight(row: {
	status: string;
	runId: string | null;
	markedRunId: string | null;
}): InventorySight {
	if (row.status === 'lost') return 'lost';
	if (row.status === 'withdrawn') return 'withdrawn';
	if (row.status === 'loaned') return 'out';
	if (!row.runId) return 'found';
	if (row.markedRunId === row.runId) return 'found';
	return 'missing';
}
