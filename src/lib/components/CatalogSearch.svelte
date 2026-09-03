<script lang="ts">
	import { resolve } from '$app/paths';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import { jacketFor } from '$lib/cover';
	import OptimizedImage from '$lib/components/OptimizedImage.svelte';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { CatalogSearchItem } from '$lib/search';

	let {
		preview,
		open = $bindable(false)
	}: {
		preview: CatalogSearchItem[];
		open?: boolean;
	} = $props();

	let query = $state('');
	let active = $state(0);
	let hits = $state<CatalogSearchItem[]>([]);
	let inputEl: HTMLInputElement | undefined = $state();

	const results = $derived(query.trim() ? hits : preview);

	$effect(() => {
		query;
		active = 0;
	});

	$effect(() => {
		if (!open) return;
		query = '';
		hits = [];
		active = 0;
		const id = requestAnimationFrame(() => inputEl?.focus());
		const original = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			cancelAnimationFrame(id);
			document.body.style.overflow = original;
		};
	});

	$effect(() => {
		const q = query.trim();
		if (!open || !q) return;

		const controller = new AbortController();
		const timer = setTimeout(async () => {
			try {
				const response = await fetch(`${resolve('/api/search')}?q=${encodeURIComponent(q)}`, {
					signal: controller.signal
				});
				if (!response.ok) return;
				const payload = (await response.json()) as { items?: CatalogSearchItem[] };
				hits = payload.items ?? [];
			} catch {
				if (!controller.signal.aborted) hits = [];
			}
		}, 180);

		return () => {
			clearTimeout(timer);
			controller.abort();
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
			window.location.assign(resolve('/books/[id]', { id: results[active].id }));
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
			transition:fly={{ y: 72, duration: 380, easing: cubicOut }}
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
							href={resolve('/books/[id]', { id: book.id })}
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
					<li in:fly={{ y: 14, duration: 420, easing: cubicOut }}>
						<Empty.Root class="border-0 p-4 md:p-6">
							<Empty.Header>
								<Empty.Media variant="default" class="mb-3">
									<div class="empty-shelf" aria-hidden="true">
										<span></span>
										<span></span>
										<span></span>
										<span></span>
										<em></em>
									</div>
								</Empty.Media>
								<Empty.Title class="font-display text-[1.15rem]">V fonde nič nesedí</Empty.Title>
								<Empty.Description>
									Pre „{query.trim()}“ sa nenašiel názov, autor ani signatúra.
								</Empty.Description>
							</Empty.Header>
							<Empty.Content>
								<Button
									variant="outline"
									size="sm"
									class="rounded-full"
									onclick={() => {
										query = '';
										inputEl?.focus();
									}}
								>
									Vymazať hľadanie
								</Button>
							</Empty.Content>
						</Empty.Root>
					</li>
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
		place-items: end stretch;
		padding: 0;
	}

	.search-backdrop {
		position: absolute;
		inset: 0;
		border: 0;
		background: color-mix(in srgb, var(--stamp, #1c1713) 62%, transparent);
		backdrop-filter: blur(22px) saturate(1.15);
		-webkit-backdrop-filter: blur(22px) saturate(1.15);
		cursor: pointer;
	}

	.search-panel {
		position: relative;
		z-index: 1;
		width: 100%;
		overflow: hidden;
		border: 1px solid color-mix(in srgb, var(--copper, #d46a1e) 28%, transparent);
		border-bottom: 0;
		border-radius: 1.15rem 1.15rem 0 0;
		background: var(--card, #f8f1e3);
		box-shadow: 0 28px 70px rgb(28 23 18 / 0.32);
		color: var(--ink, #1c1712);
		font-family: var(--body, 'Literata', serif);
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
		font-family: var(--display, 'Cormorant Garamond', serif);
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
		min-width: 0;
		width: 100%;
		border: 0;
		background: transparent;
		color: var(--ink, #1c1712);
		font-family: var(--display, 'Cormorant Garamond', serif);
		font-size: 1.05rem;
		font-weight: 700;
		outline: none;
	}

	.search-hint {
		margin: 0.7rem 1.05rem 0.35rem;
		color: var(--muted, #6d6458);
		font-family: var(--display, 'Cormorant Garamond', serif);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.search-list {
		margin: 0;
		max-height: min(24rem, 48dvh);
		overflow: auto;
		padding: 0 0.55rem max(0.85rem, env(safe-area-inset-bottom));
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
		overflow: hidden;
		font-family: var(--display, 'Cormorant Garamond', serif);
		font-size: 0.92rem;
		font-weight: 800;
		line-height: 1.2;
		text-overflow: ellipsis;
		white-space: nowrap;
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
		font-family: var(--display, 'Cormorant Garamond', serif);
		font-size: 0.72rem;
		font-weight: 800;
	}

	.search-hit-state.is-out {
		color: var(--muted, #6d6458);
	}

	.empty-shelf {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 0.28rem;
		width: 7.2rem;
		height: 4.4rem;
		padding: 0 0.55rem 0.45rem;
		border-radius: 0.7rem;
		background:
			linear-gradient(180deg, rgb(255 255 255 / 0.04), transparent 40%),
			color-mix(in srgb, var(--wash, #ece3d2) 88%, #3c2a21);
		box-shadow: inset 0 -7px 0 color-mix(in srgb, var(--ink, #3c2a21) 18%, transparent);
	}

	.empty-shelf span,
	.empty-shelf em {
		display: block;
		border-radius: 2px 2px 0 0;
		transform-origin: bottom center;
	}

	.empty-shelf span:nth-child(1) {
		width: 0.62rem;
		height: 2.35rem;
		background: #c56a4a;
		animation: empty-lift 1.8s ease-in-out infinite;
	}

	.empty-shelf span:nth-child(2) {
		width: 0.72rem;
		height: 2.85rem;
		background: #7d96a8;
		animation: empty-lift 1.8s ease-in-out 0.12s infinite;
	}

	.empty-shelf span:nth-child(3) {
		width: 0.58rem;
		height: 2.1rem;
		background: #d4a24a;
		animation: empty-lift 1.8s ease-in-out 0.24s infinite;
	}

	.empty-shelf span:nth-child(4) {
		width: 0.68rem;
		height: 2.6rem;
		background: #8fa37a;
		animation: empty-lift 1.8s ease-in-out 0.36s infinite;
	}

	.empty-shelf em {
		width: 0.85rem;
		height: 1.15rem;
		border: 1.5px dashed color-mix(in srgb, var(--ink, #3c2a21) 35%, transparent);
		animation: empty-gap 1.8s ease-in-out 0.2s infinite;
	}

	@keyframes empty-lift {
		0%,
		100% {
			transform: translateY(0);
		}
		40% {
			transform: translateY(-7px);
		}
	}

	@keyframes empty-gap {
		0%,
		100% {
			opacity: 0.35;
			transform: scaleY(0.86);
		}
		50% {
			opacity: 1;
			transform: scaleY(1);
		}
	}

	@media (min-width: 640px) {
		.search-layer {
			place-items: start center;
			padding: 12vh 1rem 2rem;
		}

		.search-panel {
			width: min(38rem, 100%);
			border-bottom: 1px solid color-mix(in srgb, var(--copper, #d46a1e) 28%, transparent);
			border-radius: 1.15rem;
		}

		.search-list {
			max-height: min(22rem, 48vh);
			padding-bottom: 0.7rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.search-backdrop,
		.search-panel,
		.empty-shelf span,
		.empty-shelf em {
			transition: none !important;
			animation: none !important;
			backdrop-filter: none;
			-webkit-backdrop-filter: none;
		}
	}
</style>
