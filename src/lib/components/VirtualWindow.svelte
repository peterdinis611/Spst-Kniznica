<script lang="ts">
	import { createWindowVirtualizer, type VirtualItem } from '@tanstack/svelte-virtual';
	import { get } from 'svelte/store';
	import type { Snippet } from 'svelte';

	let {
		count,
		estimateSize,
		overscan = 12,
		children
	}: {
		count: number;
		estimateSize: (index: number) => number;
		overscan?: number;
		children: Snippet<[{ row: VirtualItem }]>;
	} = $props();

	const virtualizer = createWindowVirtualizer({
		count: 0,
		estimateSize: () => 76,
		overscan: 12,
		initialRect: { width: 1200, height: 900 }
	});

	$effect(() => {
		get(virtualizer).setOptions({ count, estimateSize, overscan });
	});

	const rows = $derived.by(() => {
		const items = $virtualizer.getVirtualItems();
		if (items.length > 0 || count === 0) return items;

		const fallback: VirtualItem[] = [];
		const limit = Math.min(count, 28);
		let start = 0;
		for (let i = 0; i < limit; i += 1) {
			const size = estimateSize(i);
			fallback.push({
				key: i,
				index: i,
				start,
				end: start + size,
				size,
				lane: 0
			});
			start += size;
		}
		return fallback;
	});
</script>

<div class="virtual-window" style="height: {$virtualizer.getTotalSize() || rows.at(-1)?.end || 0}px">
	{#each rows as row (row.key)}
		<div class="virtual-row" style="height: {row.size}px; transform: translateY({row.start}px)">
			{@render children({ row })}
		</div>
	{/each}
</div>

<style>
	.virtual-window {
		position: relative;
		width: 100%;
	}

	.virtual-row {
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
	}
</style>
