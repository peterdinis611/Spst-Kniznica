<script lang="ts">
	import { resolve } from '$app/paths';
	import BookRow from '$lib/components/BookRow.svelte';
	import BookSpine from '$lib/components/BookSpine.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.category.name} · SPŠT Knižnica</title>
</svelte:head>

<section class="wrap pt-8 md:pt-10">
	<p class="kicker reveal">
		<a href={resolve('/odbory')} class="hover:text-brass">Odbory</a>
		· {data.category.code}
	</p>
	<div class="mt-3 flex flex-wrap items-end justify-between gap-4">
		<h1 class="display text-5xl md:text-7xl">{data.category.name}</h1>
		<span class="h-3 w-14 rounded-full" style="background: {data.category.accent}"></span>
	</div>
	<p class="mt-4 max-w-xl text-mute">{data.category.description}</p>
</section>

<div class="mt-8">
	<div class="shelf wrap">
		{#each data.books as book (book.id)}
			<BookSpine {book} />
		{/each}
	</div>
	<p class="wrap kicker mt-3">Posuň policu do strany a ťukni na chrbát knihy.</p>
</div>

<section class="wrap mt-10 space-y-3">
	{#each data.books as book, i (book.id)}
		<BookRow {book} index={i} />
	{/each}
</section>
