<script lang="ts">
	import { resolve } from '$app/paths';
	import type { CatalogBook, CategoryRecord } from '$lib/types';
	import BookCover from './BookCover.svelte';

	let { category, book }: { category: CategoryRecord; book?: CatalogBook } = $props();
</script>

<a href={resolve('/odbory/[slug]', { slug: category.slug })} class="block no-underline">
	<div class="category-tile">
		{#if book}
			<BookCover {book} size="thumb" linked={false} />
		{:else}
			<span class="text-muted-foreground text-sm">{category.code}</span>
		{/if}
	</div>
	<p class="mt-3 text-center text-sm font-semibold">{category.name}</p>
</a>
