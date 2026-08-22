<script lang="ts">
	import { resolve } from '$app/paths';
	import { flattenPageTree, DocsLayout } from 'fumadocs-svelte';
	import Seo from '$lib/components/Seo.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
	const Content = $derived(data.page.code);
	const siblings = $derived(flattenPageTree(data.pageTree));
	const index = $derived(siblings.findIndex((entry) => entry.url === data.page.url));
	const previous = $derived(index > 0 ? siblings[index - 1] : undefined);
	const next = $derived(index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined);
</script>

<Seo title={data.page.data.title} description={data.page.data.description ?? 'Príručka SPŠT knižnice.'} />

<div class="docs-folio" id="obsah">
	<div class="docs-rail">
		<a class="docs-mark no-underline" href={resolve('/')}>
			<span>SPŠT</span>
			knižnica
		</a>
		<div class="docs-rail-tools">
			<a class="docs-ghost no-underline" href={resolve('/discover')}>Do fondu</a>
			<ThemeToggle />
		</div>
	</div>

	<DocsLayout tree={data.pageTree} title="Príručka" class="docs-layout">
		<article class="docs-leaf">
			<p class="docs-kicker">Príručka fondu</p>
			<header>
				<h1>{data.page.data.title}</h1>
				{#if data.page.data.description}
					<p class="docs-lead">{data.page.data.description}</p>
				{/if}
			</header>

			<div class="docs-prose prose max-w-none">
				<Content />
			</div>

			{#if previous || next}
				<nav class="docs-pager" aria-label="Ďalšie kapitoly">
					{#if previous}
						<a class="no-underline" href={previous.url}>
							<span>Predchádzajúca</span>
							<strong>{previous.data.title}</strong>
						</a>
					{:else}
						<span></span>
					{/if}
					{#if next}
						<a class="is-next no-underline" href={next.url}>
							<span>Ďalšia</span>
							<strong>{next.data.title}</strong>
						</a>
					{/if}
				</nav>
			{/if}
		</article>
	</DocsLayout>
</div>
