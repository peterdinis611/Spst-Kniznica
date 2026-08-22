<script lang="ts">
	import { resolve } from '$app/paths';
	import { booksLabel, familyName, initials } from '$lib/format';
	import { authorSwatch } from '$lib/cover';
	import { Input } from '$lib/components/ui/input/index.js';
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';
	import type { AuthorRecord } from '$lib/types';

	let { data }: PageProps = $props();
	let q = $state('');

	const filtered = $derived(
		q.trim()
			? data.authors.filter((person) =>
					`${person.name} ${person.role} ${familyName(person.name)}`
						.toLowerCase()
						.includes(q.trim().toLowerCase())
				)
			: data.authors
	);

	const grouped = $derived.by(() => {
		const sorted = [...filtered].sort((a, b) =>
			familyName(a.name).localeCompare(familyName(b.name), 'sk')
		);
		const map = new Map<string, AuthorRecord[]>();
		for (const person of sorted) {
			const letter = familyName(person.name).slice(0, 1).toLocaleUpperCase('sk');
			const bucket = map.get(letter) ?? [];
			bucket.push(person);
			map.set(letter, bucket);
		}
		return [...map.entries()];
	});
</script>

<Seo
	title="Autori"
	description="Autori vo fonde školskej knižnice SPŠT — učebnice, príručky a povinná literatúra."
/>

<div class="flex flex-wrap items-end justify-between gap-4">
	<p class="m-0 font-body text-[1.05rem] text-muted-foreground">
		{data.authors.length} mien v katalógu
	</p>
	<label class="sr-only" for="author-q">Filter podľa mena</label>
	<Input
		id="author-q"
		class="h-11 w-full max-w-xs rounded-full border-0 bg-wash px-4 shadow-none focus-visible:ring-2 focus-visible:ring-ring"
		type="search"
		bind:value={q}
		placeholder="priezvisko alebo meno"
	/>
</div>

{#if grouped.length === 0}
	<p class="mt-12 max-w-[32ch] font-body text-[1.1rem] text-muted-foreground">
		Nikto sa nenašiel. Skús iné meno alebo priezvisko.
	</p>
{:else}
	<div class="mt-10 grid gap-x-14 gap-y-10 sm:grid-cols-2">
		{#each grouped as [letter, people] (letter)}
			<section>
				<p
					class="mb-1 font-display text-[2rem] leading-none font-semibold tracking-[-0.04em] text-foreground [font-variation-settings:'SOFT'_28,'WONK'_0]"
				>
					{letter}
				</p>
				<ul class="m-0 list-none p-0">
					{#each people as person (person.id)}
						<li class="border-t border-border">
							<a
								class="group flex items-center gap-3.5 py-3.5 text-inherit no-underline"
								href={resolve('/autori/[slug]', { slug: person.slug })}
							>
								<span
									class="grid size-10 shrink-0 place-items-center rounded-full font-sans text-[0.7rem] font-bold text-[#fffaf3]"
									style="background: {authorSwatch(person.id)}"
								>
									{initials(person.name)}
								</span>
								<span class="min-w-0 flex-1">
									<strong
										class="block truncate font-display text-[1.12rem] leading-tight font-semibold group-hover:underline group-hover:underline-offset-[0.16em]"
									>
										{person.name}
									</strong>
									<em class="mt-0.5 block font-body text-[0.88rem] text-muted-foreground italic">
										{person.role} · {person.lifespan} · {booksLabel(person.bookCount)}
									</em>
								</span>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}
