<script lang="ts" generics="T extends Record<string, any>">
	import { get } from 'svelte/store';
	import type { Snippet } from 'svelte';
	import { createVirtualizer } from '@tanstack/svelte-virtual';
	import { createTable, FlexRender } from '@tanstack/svelte-table';
	import { LIST_LIMIT } from '$lib/admin';
	import {
		isPultStack,
		isPultStamp,
		pultCellOf,
		pultFeatures,
		rowIdOf,
		type PultColumn,
		type PultFeatures
	} from '$lib/pult-ledger';

	const VIRTUAL_AFTER = 24;
	const ROW = 72;

	let {
		rows,
		columns,
		empty = 'Žiadny lístok.',
		getRowId,
		actions
	}: {
		rows: T[];
		columns: PultColumn<T>[];
		empty?: string;
		getRowId?: (row: T) => string;
		actions?: Snippet<[{ row: T }]>;
	} = $props();

	const table = createTable<PultFeatures, T>({
		features: pultFeatures,
		get columns() {
			const list: PultColumn<T>[] = [...columns];
			if (actions) {
				list.push({
					id: '_actions',
					header: '',
					enableSorting: false
				} as PultColumn<T>);
			}
			return list;
		},
		get data() {
			return rows;
		},
		getRowId: (row, index) => getRowId?.(row) ?? rowIdOf(row, index)
	});

	const modelRows = $derived(table.getRowModel().rows);
	const virtual = $derived(modelRows.length > VIRTUAL_AFTER);
	let scroller: HTMLDivElement | undefined = $state();

	const virtualizer = createVirtualizer({
		count: 0,
		getScrollElement: () => scroller ?? null,
		estimateSize: () => ROW,
		overscan: 10
	});

	$effect(() => {
		get(virtualizer).setOptions({
			count: modelRows.length,
			getScrollElement: () => scroller ?? null,
			estimateSize: () => ROW,
			overscan: 10
		});
	});

	const windowRows = $derived.by(() => {
		if (!virtual) {
			return modelRows.map((row, index) => ({
				key: row.id,
				index,
				start: index * ROW,
				size: ROW
			}));
		}
		const items = $virtualizer.getVirtualItems();
		if (items.length > 0 || modelRows.length === 0) return items;
		return modelRows.slice(0, 20).map((row, index) => ({
			key: row.id,
			index,
			start: index * ROW,
			size: ROW
		}));
	});

	const space = $derived(
		virtual ? $virtualizer.getTotalSize() || modelRows.length * ROW : modelRows.length * ROW
	);
</script>

{#if rows.length === 0}
	<p class="pult-empty">{empty}</p>
{:else}
	<div class="pult-ledger" bind:this={scroller} role="grid" aria-label="Register zásuvky">
		<div
			class="pult-ledger-head"
			style="--pult-cols: {table.getAllColumns().length}"
			role="row"
		>
			{#each table.getHeaderGroups() as group (group.id)}
				{#each group.headers as header (header.id)}
					{@const sorted = header.column.getIsSorted()}
					<div
						role="columnheader"
						aria-sort={sorted === 'asc'
							? 'ascending'
							: sorted === 'desc'
								? 'descending'
								: undefined}
					>
						{#if header.column.getCanSort()}
							<button
								class="pult-sort"
								type="button"
								onclick={header.column.getToggleSortingHandler()}
							>
								<FlexRender {header} />
								<span class="pult-sort-mark" aria-hidden="true">
									{sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : '↕'}
								</span>
							</button>
						{:else}
							<span class="pult-sort is-mute">
								<FlexRender {header} />
							</span>
						{/if}
					</div>
				{/each}
			{/each}
		</div>

		<div class="pult-ledger-space" style="height: {space}px" role="rowgroup">
			{#each windowRows as item (item.key)}
				{@const row = modelRows[item.index]}
				{#if row}
					<div
						class="pult-ledger-row"
						style="--pult-cols: {row.getAllCells().length}; height: {item.size}px; transform: translateY({item.start}px)"
						role="row"
					>
						{#each row.getAllCells() as cell (cell.id)}
							<div class="pult-ledger-cell" role="cell">
								{#if cell.column.id === '_actions'}
									<div class="pult-actions">
										{@render actions?.({ row: row.original })}
									</div>
								{:else}
									{@const value = pultCellOf(cell)}
									{#if isPultStack(value)}
										<strong>{value.title}</strong>
										{#if value.hint}<em>{value.hint}</em>{/if}
									{:else if isPultStamp(value)}
										<span class="pult-role" class:is-desk={value.desk}>{value.stamp}</span>
									{:else}
										{value ?? ''}
									{/if}
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			{/each}
		</div>
	</div>
	<p class="pult-count">
		{rows.length}{rows.length >= LIST_LIMIT ? '+' : ''} v zásuvke
		{#if virtual} · virtuálny register{/if}
	</p>
{/if}
