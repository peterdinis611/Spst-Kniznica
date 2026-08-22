<script lang="ts">
	import { resolve } from '$app/paths';
	import LockerCard from '$lib/components/LockerCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const activeName = $derived(data.categories.find((cat) => cat.slug === data.odbor)?.name);
</script>

<svelte:head>
	<title>Knihy · SPŠT Knižnica</title>
</svelte:head>

<section class="wrap pt-8 md:pt-10">
	<p class="kicker reveal">
		{data.books.length} skriniek
		{#if data.q}pre „{data.q}“{/if}
		{#if activeName}· {activeName}{/if}
	</p>
	<div class="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
		<h1 class="display text-5xl md:text-7xl">Knihy</h1>
		<form class="search w-full max-w-md" method="GET">
			<label class="sr-only" for="q">Filtrovať</label>
			<input id="q" type="search" name="q" value={data.q} placeholder="Spresni hľadanie" />
			{#if data.odbor}
				<input type="hidden" name="odbor" value={data.odbor} />
			{/if}
			<button class="btn btn-navy px-4" type="submit">OK</button>
		</form>
	</div>

	<div class="mt-5 flex flex-wrap gap-2">
		<a href={resolve('/knihy')} class="chip {!data.odbor ? 'is-on' : ''}">Všetko</a>
		{#each data.categories as cat (cat.id)}
			<a
				href="{resolve('/knihy')}?odbor={cat.slug}{data.q ? `&q=${encodeURIComponent(data.q)}` : ''}"
				class="chip {data.odbor === cat.slug ? 'is-on' : ''}"
			>
				{cat.name}
			</a>
		{/each}
	</div>

	{#if data.books.length === 0}
		<div class="id-card mt-10 p-8">
			<p class="display text-3xl">Prázdny rad</p>
			<p class="mt-2 opacity-80">Skús iné slovo.</p>
			<a href={resolve('/knihy')} class="btn mt-5">Zrušiť filter</a>
		</div>
	{:else}
		<div class="locker-grid mt-8">
			{#each data.books as book, i (book.id)}
				<LockerCard {book} index={i} />
			{/each}
		</div>
	{/if}
</section>
