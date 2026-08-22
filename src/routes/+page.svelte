<script lang="ts">
	import { resolve } from '$app/paths';
	import LockerCard from '$lib/components/LockerCard.svelte';
	import { authorLine, copiesLabel } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const featured = $derived(data.featured);
</script>

<svelte:head>
	<title>Domov · SPŠT Knižnica</title>
</svelte:head>

<section class="wrap grid items-end gap-8 pt-10 md:grid-cols-12 md:pt-14">
	<div class="reveal md:col-span-7">
		<p class="kicker">Školská knižnica · {data.stats.books} skriniek</p>
		<h1 class="display mt-3 text-[clamp(3.4rem,11vw,7rem)]">
			Otvor si<br /><span class="text-coral">skrinku.</span>
		</h1>
		<p class="mt-4 max-w-md text-lg">
			Každá kniha má dvierka. Zelený zámok = môžeš si ju vziať. Červený = už ju má niekto iný.
		</p>
		<form class="search mt-6 max-w-lg" method="GET" action={resolve('/knihy')}>
			<label class="sr-only" for="home-q">Hľadať</label>
			<input id="home-q" type="search" name="q" placeholder="Algoritmy, Rúfus, fyzika…" />
			<button class="btn" type="submit">Hľadaj</button>
		</form>
	</div>

	<div class="reveal relative md:col-span-5" style="--i: 2">
		<div
			class="absolute -right-2 top-0 grid h-28 w-28 place-items-center rounded-full border-[3px] border-navy bg-sky font-display text-3xl font-extrabold shadow-[5px_5px_0_#14233d]"
		>
			{data.stats.available}
			<span class="kicker absolute bottom-3">voľných</span>
		</div>
		<div
			class="mt-10 ml-6 grid h-36 w-36 place-items-center rounded-full border-[3px] border-navy bg-butter font-display text-3xl font-extrabold shadow-[5px_5px_0_#14233d]"
		>
			{data.stats.authors}
			<span class="kicker absolute translate-y-8">autorov</span>
		</div>
	</div>
</section>

{#if featured}
	<section class="wrap mt-12">
		<article class="id-card reveal grid overflow-hidden md:grid-cols-2">
			<div class="bg-navy p-7 text-foam md:p-9">
				<p class="kicker text-butter">Dnes odporúčame</p>
				<h2 class="display mt-4 text-4xl text-foam md:text-5xl">{featured.title}</h2>
				<p class="mt-3 opacity-80">{authorLine(featured.authors)}</p>
			</div>
			<div class="flex flex-col justify-between p-7 md:p-9">
				<p>{featured.description}</p>
				<div class="mt-6 flex flex-wrap items-center gap-3">
					<span class="chip">{copiesLabel(featured.copiesAvailable, featured.copiesTotal)}</span>
					<a href={resolve('/knihy/[id]', { id: featured.id })} class="btn">Otvor dvierka</a>
				</div>
			</div>
		</article>
	</section>
{/if}

<section class="wrap mt-10">
	<p class="kicker">Odbory</p>
	<div class="mt-3 flex flex-wrap gap-2">
		{#each data.categories as cat (cat.id)}
			<a href={resolve('/odbory/[slug]', { slug: cat.slug })} class="chip">
				{cat.name}
				<span class="opacity-60">{cat.bookCount}</span>
			</a>
		{/each}
	</div>
</section>

<section class="wrap mt-12">
	<div class="mb-5 flex items-end justify-between">
		<h2 class="display text-4xl">Stena skriniek</h2>
		<a href={resolve('/knihy')} class="btn btn-ghost">Celý rad</a>
	</div>
	<div class="locker-grid">
		{#each data.books.slice(0, 9) as book, i (book.id)}
			<LockerCard {book} index={i} />
		{/each}
	</div>
</section>
