<script lang="ts">
	import { resolve } from '$app/paths';
	import Fuse from 'fuse.js';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import { jacketFor } from '$lib/cover';
	import OptimizedImage from '$lib/components/OptimizedImage.svelte';
	import type { CatalogSearchItem } from '$lib/search';

	let {
		items,
		open = $bindable(false)
	}: {
		items: CatalogSearchItem[];
		open?: boolean;
	} = $props();

	let query = $state('');
	let active = $state(0);
	let inputEl: HTMLInputElement | undefined = $state();

	const fuse = $derived(
		new Fuse(items, {
			keys: [
				{ name: 'title', weight: 0.45 },
				{ name: 'authors', weight: 0.25 },
				{ name: 'callNumber', weight: 0.2 },
				{ name: 'category', weight: 0.07 },
				{ name: 'isbn', weight: 0.03 }
			],
			threshold: 0.38,
			ignoreLocation: true,
			ignoreDiacritics: true,
			minMatchCharLength: 1
		})
	);

	const results = $derived.by(() => {
		const q = query.trim();
		if (!q) return items.slice(0, 6);
		return fuse.search(q, { limit: 8 }).map((hit) => hit.item);
	});

	$effect(() => {
		query;
		active = 0;
	});

	$effect(() => {
		if (!open) return;
		query = '';
		active = 0;
		const id = requestAnimationFrame(() => inputEl?.focus());
		const original = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			cancelAnimationFrame(id);
			document.body.style.overflow = original;
		};
	});

	function closeSearch() {
		open = false;
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			open = !open;
		}
	}

	function onDialogKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			closeSearch();
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			active = Math.min(active + 1, Math.max(results.length - 1, 0));
			return;
		}
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			active = Math.max(active - 1, 0);
			return;
		}
		if (event.key === 'Enter' && results[active]) {
			event.preventDefault();
			window.location.assign(resolve('/knihy/[id]', { id: results[active].id }));
		}
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if open}
	<div class="search-layer" role="presentation">
		<button
			type="button"
			class="search-backdrop"
			aria-label="Zavrieť hľadanie"
			onclick={closeSearch}
			transition:fade={{ duration: 180 }}
		></button>
		<div
			class="search-panel"
			role="dialog"
			aria-modal="true"
			aria-labelledby="catalog-search-title"
			tabindex="-1"
			transition:fly={{ y: 36, duration: 380, easing: cubicOut }}
			onkeydown={onDialogKeydown}
		>
			<div class="search-head">
				<p id="catalog-search-title" class="search-kicker">Katalóg SPŠT</p>
				<button type="button" class="search-close" onclick={closeSearch} aria-label="Zavrieť">
					<XIcon class="size-4" />
				</button>
			</div>
			<label class="search-field">
				<SearchIcon class="size-5" />
				<input
					bind:this={inputEl}
					bind:value={query}
					type="search"
					placeholder="Názov, autor, signatúra alebo ISBN…"
					autocomplete="off"
					spellcheck="false"
				/>
			</label>
			<p class="search-hint">
				{query.trim() ? `${results.length} zásahov` : 'Najnovšie vo fonde'}
			</p>
			<ul class="search-list">
				{#each results as book, i (book.id)}
					{@const jacket = jacketFor(book)}
					<li>
						<a
							class="search-hit"
							class:is-active={i === active}
							href={resolve('/knihy/[id]', { id: book.id })}
							onmouseenter={() => (active = i)}
						>
							<OptimizedImage
								src={jacket.photo}
								preset="search"
								fallbackLabel={book.title}
								fallbackBg={jacket.bg}
								fallbackFg={jacket.fg}
							/>
							<span class="search-hit-copy">
								<strong>{book.title}</strong>
								<em>{book.authors} · {book.callNumber}</em>
							</span>
							<span class="search-hit-state" class:is-out={book.copiesAvailable === 0}>
								{book.copiesAvailable > 0 ? 'Voľná' : 'Vonku'}
							</span>
						</a>
					</li>
				{:else}
					<li class="search-empty">V fonde nič nesedí. Skús iný názov alebo signatúru.</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}

<style>
	.search-layer {
		position: fixed;
		inset: 0;
		z-index: 80;
		display: grid;
		place-items: start center;
		padding: 12vh 1rem 2rem;
	}

	.search-backdrop {
		position: absolute;
		inset: 0;
		border: 0;
		background: color-mix(in srgb, var(--forest, #1b3d32) 42%, transparent);
		backdrop-filter: blur(22px) saturate(1.15);
		-webkit-backdrop-filter: blur(22px) saturate(1.15);
		cursor: pointer;
	}

	.search-panel {
		position: relative;
		z-index: 1;
		width: min(38rem, 100%);
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--copper, #d46a1e) 28%, transparent);
		border-radius: 1.15rem;
		background: var(--card, #f8f1e3);
		box-shadow: 0 28px 70px rgb(28 23 18 / 0.32);
		color: var(--ink, #1c1712);
		font-family: var(--body, 'Newsreader', serif);
	}

	.search-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.05rem 0.15rem;
	}

	.search-kicker {
		margin: 0;
		color: var(--copper, #d46a1e);
		font-family: var(--display, 'Fraunces', serif);
		font-size: 0.82rem;
		font-weight: 600;
		font-style: italic;
		letter-spacing: 0.02em;
	}

	.search-close {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border: 0;
		border-radius: 999px;
		background: var(--wash, #ece3d2);
		color: var(--ink, #1c1712);
		cursor: pointer;
	}

	.search-field {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		margin: 0.55rem 1.05rem 0;
		padding-bottom: 0.7rem;
		border-bottom: 1px solid var(--line, #e4d7bf);
		color: var(--copper, #d46a1e);
	}

	.search-field input {
		width: 100%;
		border: 0;
		background: transparent;
		color: var(--ink, #1c1712);
		font-family: var(--display, 'Fraunces', serif);
		font-size: 1.05rem;
		font-weight: 700;
		outline: none;
	}

	.search-hint {
		margin: 0.7rem 1.05rem 0.35rem;
		color: var(--muted, #6d6458);
		font-family: var(--display, 'Fraunces', serif);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.search-list {
		margin: 0;
		max-height: min(22rem, 48vh);
		overflow: auto;
		padding: 0 0.55rem 0.7rem;
		list-style: none;
	}

	.search-hit {
		display: grid;
		grid-template-columns: 2.4rem 1fr auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.55rem 0.5rem;
		border-radius: 0.85rem;
		color: inherit;
		text-decoration: none;
	}

	.search-hit.is-active,
	.search-hit:hover {
		background: color-mix(in srgb, var(--copper, #d46a1e) 16%, var(--card, #f8f1e3));
	}

	.search-hit :global(.opt-image) {
		width: 2.4rem;
		height: 3.2rem;
		border-radius: 0.35rem;
		aspect-ratio: auto;
		background: var(--line, #e4d7bf);
	}

	.search-hit-copy {
		display: flex;
		min-width: 0;
		flex-direction: column;
	}

	.search-hit-copy strong {
		font-family: var(--display, 'Fraunces', serif);
		font-size: 0.92rem;
		font-weight: 800;
		line-height: 1.2;
	}

	.search-hit-copy em {
		margin-top: 0.15rem;
		overflow: hidden;
		color: var(--muted, #6d6458);
		font-size: 0.75rem;
		font-style: normal;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.search-hit-state {
		color: var(--copper, #d46a1e);
		font-family: var(--display, 'Fraunces', serif);
		font-size: 0.72rem;
		font-weight: 800;
	}

	.search-hit-state.is-out {
		color: var(--muted, #6d6458);
	}

	.search-empty {
		padding: 1.2rem 0.7rem 1.4rem;
		color: var(--muted, #6d6458);
		font-size: 0.9rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.search-backdrop,
		.search-panel {
			transition: none !important;
			animation: none !important;
			backdrop-filter: none;
			-webkit-backdrop-filter: none;
		}
	}
</style>
