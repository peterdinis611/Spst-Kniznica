<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Odbory · SPŠT Knižnica</title>
</svelte:head>

<section class="wrap pt-8 md:pt-10">
	<p class="kicker reveal">Police podľa predmetu</p>
	<h1 class="display reveal mt-2 text-5xl md:text-7xl" style="--i: 1">Odbory</h1>
	<p class="reveal mt-4 max-w-lg text-mute" style="--i: 2">
		Vyber si predmet. Vo vnútri uvidíš chrbty kníh aj zoznam, z ktorého sa dá hneď požičať.
	</p>

	<div class="mt-10 grid gap-3 sm:grid-cols-2">
		{#each data.categories as cat, i (cat.id)}
			<a
				href={resolve('/odbory/[slug]', { slug: cat.slug })}
				class="panel reveal group p-6 no-underline hover:border-brass"
				style="--i: {i}"
			>
				<div class="flex items-center justify-between gap-3">
					<span class="kicker">{cat.code}</span>
					<span class="h-2.5 w-10 rounded-full" style="background: {cat.accent}"></span>
				</div>
				<h2 class="font-display mt-6 text-4xl uppercase group-hover:text-brass">{cat.name}</h2>
				<p class="mt-3 text-sm leading-relaxed text-mute">{cat.description}</p>
				<p class="kicker mt-6">{cat.bookCount} kníh</p>
			</a>
		{/each}
	</div>
</section>
