<script lang="ts">
	import { flattenPageTree } from 'fumadocs-svelte';
	import { docsHref } from '$lib/docs/href';
	import { sortDocChapters } from '$lib/docs/order';
	import Handbook from '$lib/components/Handbook.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	const Content = $derived(data.page.code);
	const siblings = $derived(sortDocChapters(flattenPageTree(data.pageTree)));
	const index = $derived(siblings.findIndex((entry) => entry.url === data.page.url));
	const previous = $derived(index > 0 ? siblings[index - 1] : undefined);
	const next = $derived(index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined);
</script>

<Seo title={data.page.data.title} description={data.page.data.description ?? 'Príručka SPŠT knižnice.'} />

<Handbook tree={data.pageTree}>
	<article class="docs-leaf">
		<p class="docs-kicker">Príručka fondu</p>
		<header>
			<h1>{data.page.data.title}</h1>
			{#if data.page.data.description}
				<p class="docs-lead">{data.page.data.description}</p>
			{/if}
		</header>

		<div class="docs-prose">
			<Content />
		</div>

		{#if previous || next}
			<nav class="docs-pager" aria-label="Ďalšie kapitoly">
				{#if previous}
					<a class="no-underline" href={docsHref(previous.url)}>
						<span>Predchádzajúca</span>
						<strong>{previous.data.title}</strong>
					</a>
				{/if}
				{#if next}
					<a class="is-next no-underline" href={docsHref(next.url)}>
						<span>Ďalšia</span>
						<strong>{next.data.title}</strong>
					</a>
				{/if}
			</nav>
		{/if}
	</article>
</Handbook>
