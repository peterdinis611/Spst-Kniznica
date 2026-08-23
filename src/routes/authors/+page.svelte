<script lang="ts">
	import { resolve } from '$app/paths';
	import { booksLabel, familyName, initials } from '$lib/format';
	import { authorSwatch } from '$lib/cover';
	import Seo from '$lib/components/Seo.svelte';
	import VirtualWindow from '$lib/components/VirtualWindow.svelte';
	import type { PageProps } from './$types';
	import type { AuthorSlip } from '$lib/types';

	let { data }: PageProps = $props();

	const filtered = $derived(
		data.q.trim()
			? data.authors.filter((person) =>
					`${person.name} ${person.role} ${familyName(person.name)}`
						.toLowerCase()
						.includes(data.q.trim().toLowerCase())
				)
			: data.authors
	);

	const grouped = $derived.by(() => {
		const sorted = [...filtered].sort((a, b) =>
			familyName(a.name).localeCompare(familyName(b.name), 'sk')
		);
			const map = new Map<string, AuthorSlip[]>();
		for (const person of sorted) {
			const letter = familyName(person.name).slice(0, 1).toLocaleUpperCase('sk');
			const bucket = map.get(letter) ?? [];
			bucket.push(person);
			map.set(letter, bucket);
		}
		return [...map.entries()];
	});

	const virtual = $derived(filtered.length > 40);
	const lanes = $derived(
		grouped.flatMap(([letter, people]) => [
			{ kind: 'letter' as const, id: `L-${letter}`, letter },
			...people.map((person) => ({ kind: 'person' as const, id: person.id, person }))
		])
	);

	function laneSize(index: number) {
		return lanes[index]?.kind === 'letter' ? 56 : 72;
	}
</script>

<Seo
	title="Autori"
	description="Autori vo fonde školskej knižnice SPŠT — učebnice, príručky a povinná literatúra."
/>

<p class="m-0 font-body text-[1.05rem] text-muted-foreground">
	{filtered.length.toLocaleString('sk-SK')}
	{filtered.length === 1 ? 'meno' : filtered.length < 5 ? 'mená' : 'mien'} v katalógu
	{#if data.q.trim()}
		pre „{data.q.trim()}“
	{/if}
	{#if virtual}
		<span class="hidden sm:inline">· virtualizovaný register</span>
	{/if}
</p>

{#if grouped.length === 0}
	<p class="mt-12 max-w-[32ch] font-body text-[1.1rem] text-muted-foreground">
		Nikto sa nenašiel. Skús iné meno alebo priezvisko.
	</p>
{:else if virtual}
	<div class="mt-8">
		<VirtualWindow count={lanes.length} estimateSize={laneSize}>
			{#snippet children({ row })}
				{@const item = lanes[row.index]}
				{#if item?.kind === 'letter'}
					<p
						class="mb-0 font-display text-[1.55rem] leading-none font-semibold tracking-[-0.04em] [font-variation-settings:'SOFT'_28,'WONK'_0] sm:text-[2rem]"
					>
						{item.letter}
					</p>
				{:else if item?.kind === 'person'}
					{@const person = item.person}
					<a
						class="group flex h-full items-center gap-3.5 border-t border-border text-inherit no-underline"
						href={resolve('/authors/[slug]', { slug: person.slug })}
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
							<em class="mt-0.5 block truncate font-body text-[0.88rem] text-muted-foreground italic">
								{person.role} · {person.lifespan} · {booksLabel(person.bookCount)}
							</em>
						</span>
					</a>
				{/if}
			{/snippet}
		</VirtualWindow>
	</div>
{:else}
	<div class="mt-10 grid gap-x-14 gap-y-10 sm:grid-cols-2">
		{#each grouped as [letter, people] (letter)}
			<section>
				<p
					class="mb-1 font-display text-[1.55rem] leading-none font-semibold tracking-[-0.04em] text-foreground [font-variation-settings:'SOFT'_28,'WONK'_0] sm:text-[2rem]"
				>
					{letter}
				</p>
				<ul class="m-0 list-none p-0">
					{#each people as person (person.id)}
						<li class="border-t border-border">
							<a
								class="group flex items-center gap-3.5 py-3.5 text-inherit no-underline"
								href={resolve('/authors/[slug]', { slug: person.slug })}
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
