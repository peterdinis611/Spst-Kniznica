<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { flattenPageTree, type PageTree } from 'fumadocs-svelte';
	import { docsHref } from '$lib/docs/href';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import type { Snippet } from 'svelte';

	let { tree, children }: { tree: PageTree; children: Snippet } = $props();

	const chapters = $derived(flattenPageTree(tree));
	let open = $state(false);

	function current(url: string) {
		return page.url.pathname === url || (url === '/docs' && page.url.pathname === '/docs/');
	}

	function close() {
		open = false;
	}
</script>

<div class="handbook" id="obsah">
	<header class="handbook-bind">
		<a class="handbook-mark no-underline" href={resolve('/')}>
			<span>SPŠT</span>
			knižnica
		</a>
		<button type="button" class="handbook-toc-btn" onclick={() => (open = !open)} aria-expanded={open}>
			Kapitoly
		</button>
		<div class="handbook-tools">
			<a class="handbook-cta no-underline" href={resolve('/discover')}>Do fondu</a>
			<ThemeToggle />
		</div>
	</header>

	<div class="handbook-spread">
		{#if open}
			<button type="button" class="handbook-scrim" aria-label="Zavrieť kapitoly" onclick={close}></button>
		{/if}

		<aside class="handbook-index" class:is-open={open}>
			<p class="handbook-spine" aria-hidden="true"><span>Príručka</span></p>
			<div class="handbook-index-body">
				<p class="handbook-kicker">Kapitoly</p>
				<nav aria-label="Kapitoly príručky">
					{#each chapters as chapter, i (chapter.url)}
						<a
							class="handbook-item no-underline"
							class:is-on={current(chapter.url)}
							href={docsHref(chapter.url)}
							aria-current={current(chapter.url) ? 'page' : undefined}
							onclick={close}
						>
							<em>{String(i + 1).padStart(2, '0')}</em>
							<span>{chapter.data.title}</span>
						</a>
					{/each}
				</nav>
			</div>
		</aside>

		<div class="handbook-paper">
			{@render children()}
		</div>
	</div>
</div>
