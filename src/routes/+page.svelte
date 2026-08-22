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
		[data.featured, ...data.books].filter((book): book is NonNullable<typeof book> => Boolean(book)).slice(0, 8)
	);

	function sample(slug: string) {
		return recommended.find((book) => book.category.slug === slug) ?? data.books.find((book) => book.category.slug === slug);
	}
</script>

<svelte:head>
	<title>Objavovať · SPŠT Knižnica</title>
</svelte:head>

<section>
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-xl font-bold">Odporúčané knihy</h2>
		<Button href={resolve('/knihy')} variant="ghost" size="sm" class="text-muted-foreground">
			Zobraziť všetky
			<ChevronRightIcon />
		</Button>
	</div>
	<CoverRail books={recommended} />
</section>

<section class="mt-10">
	<div class="mb-5 flex items-center justify-between">
		<h2 class="text-xl font-bold">Odbory</h2>
		<Button href={resolve('/odbory')} variant="ghost" size="icon-sm" aria-label="Všetky odbory">
			<LayoutGridIcon />
		</Button>
	</div>
	<div class="grid grid-cols-2 gap-6 sm:grid-cols-4">
		{#each data.categories.slice(0, 4) as cat (cat.id)}
			<CategoryTile category={cat} book={sample(cat.slug)} />
		{/each}
	</div>
</section>
