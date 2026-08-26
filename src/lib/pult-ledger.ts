import {
	createSortedRowModel,
	rowSortingFeature,
	sortFn_alphanumeric,
	sortFn_basic,
	tableFeatures,
	type ColumnDef,
	type RowData
} from '@tanstack/table-core';

export const pultFeatures = tableFeatures({
	rowSortingFeature,
	sortedRowModel: createSortedRowModel(),
	sortFns: {
		alphanumeric: sortFn_alphanumeric,
		basic: sortFn_basic
	}
});

export type PultFeatures = typeof pultFeatures;
export type PultColumn<T extends RowData> = ColumnDef<PultFeatures, T>;

export type PultCell =
	| string
	| number
	| { title: string; hint?: string }
	| { stamp: string; desk?: boolean };

export function isPultStack(value: unknown): value is { title: string; hint?: string } {
	return Boolean(value && typeof value === 'object' && 'title' in value && !('stamp' in value));
}

export function isPultStamp(value: unknown): value is { stamp: string; desk?: boolean } {
	return Boolean(value && typeof value === 'object' && 'stamp' in value);
}

export async function pickCurrent<T extends { id: string }>(
	rows: T[],
	id: string,
	fallback?: (id: string) => T | null | undefined | Promise<T | null | undefined>
) {
	if (!id) return null;
	return rows.find((row) => row.id === id) ?? (await fallback?.(id)) ?? null;
}

export function pultHref(url: URL, patch: Record<string, string | null>) {
	const params = new URLSearchParams(url.search);
	for (const [key, value] of Object.entries(patch)) {
		if (value === null || value === '') params.delete(key);
		else params.set(key, value);
	}
	const query = params.toString();
	return query ? `${url.pathname}?${query}` : url.pathname;
}

export function pultSearchPath(url: URL, q: string) {
	return pultHref(url, { q: q.trim() });
}

export function rowIdOf(row: unknown, index: number) {
	if (row && typeof row === 'object' && 'id' in row && row.id != null) return String(row.id);
	return String(index);
}

/** Cell renderer output, not the raw accessor — otherwise stacked slips become a string. */
export function pultCellOf(cell: {
	column: { columnDef: { cell?: unknown } };
	getContext: () => unknown;
	getValue: () => unknown;
}) {
	const template = cell.column.columnDef.cell;
	if (typeof template === 'function') return template(cell.getContext());
	if (typeof template === 'string' || typeof template === 'number') return template;
	return cell.getValue();
}
