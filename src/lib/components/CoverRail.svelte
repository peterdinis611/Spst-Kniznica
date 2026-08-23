<script lang="ts">
	import type { BookSlip } from '$lib/types';
	import BookCover from './BookCover.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let { books }: { books: BookSlip[] } = $props();
	let rail: HTMLDivElement | undefined = $state();

	function next() {
		rail?.scrollBy({ left: 320, behavior: 'smooth' });
	}
</script>

<div class="relative min-w-0 max-w-full">
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
			class="bg-card absolute top-[42%] right-1 z-10 size-11 -translate-y-1/2 rounded-full shadow-md"
			onclick={next}
			aria-label="Ďalšie knihy"
		>
			<ChevronRightIcon />
		</Button>
	{/if}
</div>
