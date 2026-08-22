<script lang="ts">
	import { resolve } from '$app/paths';
	import BookRow from '$lib/components/BookRow.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.author.name} · SPŠT Knižnica</title>
</svelte:head>

<section class="wrap pt-8 md:pt-10">
	<p class="kicker reveal">
		<a href={resolve('/autori')} class="hover:text-brass">Autori</a>
		· {data.author.role}
	</p>
	<div class="mt-3 grid gap-6 md:grid-cols-[1.3fr_0.7fr] md:items-end">
		<div>
			<h1 class="display text-5xl md:text-6xl">{data.author.name}</h1>
			<p class="kicker mt-3">{data.author.lifespan}</p>
		</div>
		<p class="text-mute">{data.author.bio}</p>
	</div>

	<div class="mt-10 space-y-3">
		{#each data.books as book, i (book.id)}
			<BookRow {book} index={i} />
		{/each}
	</div>
</section>
