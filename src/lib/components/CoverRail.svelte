<script lang="ts">
	import type { CatalogBook } from '$lib/types';
	import BookCover from './BookCover.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let { books }: { books: CatalogBook[] } = $props();
	let rail: HTMLDivElement | undefined = $state();

	function next() {
		rail?.scrollBy({ left: 320, behavior: 'smooth' });
	}
</script>

<div class="relative">
	<div class="cover-rail" bind:this={rail}>
		{#each books as book (book.id)}
			<BookCover {book} size="rail" />
		{/each}
	</div>
	{#if books.length > 3}
		<Button
			type="button"
			variant="secondary"
			size="icon-lg"
			class="absolute top-[42%] right-1 z-10 size-11 -translate-y-1/2 rounded-full bg-white shadow-md"
			onclick={next}
			aria-label="Next books"
		>
			<ChevronRightIcon />
		</Button>
	{/if}
</div>
