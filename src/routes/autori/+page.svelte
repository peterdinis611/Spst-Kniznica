<script lang="ts">
	import { resolve } from '$app/paths';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import Seo from '$lib/components/Seo.svelte';
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

<Seo
	title="Autori"
	description="Autori vo fonde školskej knižnice SPŠT — učebnice, príručky a povinná literatúra."
/>

<div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
	<p class="text-muted-foreground text-sm">{data.authors.length} mien v katalógu</p>
	<div class="w-full max-w-sm">
		<label class="sr-only" for="author-q">Filter</label>
		<Input id="author-q" class="h-10 rounded-full" type="search" bind:value={q} placeholder="Meno…" />
	</div>
</div>

{#if filtered.length === 0}
	<Alert.Root class="mt-10">
		<Alert.Title>Nikto sa nenašiel</Alert.Title>
		<Alert.Description>Skús iné meno alebo priezvisko.</Alert.Description>
	</Alert.Root>
{:else}
	<div class="mt-8 grid gap-3 sm:grid-cols-2">
		{#each filtered as person (person.id)}
			<a href={resolve('/autori/[slug]', { slug: person.slug })} class="block no-underline">
				<Card.Root class="h-full transition-transform hover:-translate-y-1">
					<Card.Header>
						<Badge variant="outline">{person.role}</Badge>
						<Card.Title class="font-serif text-3xl">{person.name}</Card.Title>
						<Card.Description>
							{person.lifespan} · {person.bookCount} kníh
						</Card.Description>
					</Card.Header>
				</Card.Root>
			</a>
		{/each}
	</div>
{/if}
