<script lang="ts">
	import { resolve } from '$app/paths';
	import CoverRail from '$lib/components/CoverRail.svelte';
	import CategoryTile from '$lib/components/CategoryTile.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { PageProps } from './$types';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';

	let { data }: PageProps = $props();
	const recommended = $derived(
		[data.featured, ...data.books]
			.filter((book): book is NonNullable<typeof book> => Boolean(book))
			.slice(0, 8)
	);

	function sample(slug: string) {
		return (
			recommended.find((book) => book.category.slug === slug) ??
			data.books.find((book) => book.category.slug === slug)
		);
	}
</script>

<svelte:head>
	<title>Objavovať · SPŠT knižnica</title>
</svelte:head>

<section>
	<div class="mb-5 flex items-center justify-between">
		<h2 class="font-display text-xl font-extrabold">Na polici</h2>
		<Button href={resolve('/knihy')} variant="secondary" size="sm" class="rounded-sm">
			Celý fond
			<ChevronRightIcon class="size-3.5" />
		</Button>
	</div>
	<CoverRail books={recommended} />
</section>

<section class="mt-4">
	<div class="mb-5 flex items-center justify-between">
		<h2 class="font-display text-xl font-extrabold">Odbory</h2>
		<Button href={resolve('/odbory')} variant="ghost" size="icon-sm" aria-label="Odbory">
			<LayoutGridIcon class="size-4" />
		</Button>
	</div>
	<div class="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
		{#each data.categories.slice(0, 4) as cat (cat.id)}
			<CategoryTile category={cat} book={sample(cat.slug)} />
		{/each}
	</div>
</section>
