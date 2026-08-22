<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let q = $state('');

	const filtered = $derived(
		q.trim()
			? data.authors.filter((person) =>
					`${person.name} ${person.role}`.toLowerCase().includes(q.trim().toLowerCase())
				)
			: data.authors
	);
</script>

<svelte:head>
	<title>Autori · SPŠT Knižnica</title>
</svelte:head>

<section class="wrap pt-8 md:pt-10">
	<p class="kicker reveal">{data.authors.length} mien v registri</p>
	<div class="mt-2 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
		<h1 class="display reveal text-5xl md:text-7xl" style="--i: 1">Autori</h1>
		<label class="search w-full max-w-sm">
			<span class="sr-only">Filtrovať autorov</span>
			<input type="search" bind:value={q} placeholder="Meno alebo úloha" />
		</label>
	</div>

	{#if filtered.length === 0}
		<p class="mt-10 text-mute">Také meno v registri nie je.</p>
	{:else}
		<ol class="mt-8 divide-y divide-line border-y border-line">
			{#each filtered as person, i (person.id)}
				<li class="reveal" style="--i: {i}">
					<a
						href={resolve('/autori/[slug]', { slug: person.slug })}
						class="grid grid-cols-12 items-center gap-3 py-4 no-underline hover:text-brass"
					>
						<span class="col-span-2 font-mono text-xs text-mute md:col-span-1">
							{String(i + 1).padStart(2, '0')}
						</span>
						<span class="col-span-10 md:col-span-6">
							<span class="block font-display text-2xl uppercase md:text-3xl">{person.name}</span>
							<span class="text-sm text-mute">{person.role}</span>
						</span>
						<span class="col-span-7 hidden text-sm text-mute md:col-span-3 md:block">{person.lifespan}</span>
						<span class="col-span-5 text-right text-sm text-mute md:col-span-2">
							{person.bookCount}
							{person.bookCount === 1 ? 'kniha' : 'kníh'}
						</span>
					</a>
				</li>
			{/each}
		</ol>
	{/if}
</section>
