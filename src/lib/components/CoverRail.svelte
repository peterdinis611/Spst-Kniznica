<script lang="ts">
	import { resolve } from '$app/paths';
	import type { BookSlip } from '$lib/types';
	import { authorLine, copiesLabel } from '$lib/format';
	import { jacketFor } from '$lib/cover';
	import BookCover from './BookCover.svelte';
	import OptimizedImage from './OptimizedImage.svelte';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let { books }: { books: BookSlip[] } = $props();

	let index = $state(0);
	let plain = $state(false);
	let dragged = false;
	let skipClick = false;
	let originX = 0;

	const total = $derived(books.length);
	const cursor = $derived(total > 0 ? ((index % total) + total) % total : 0);
	const current = $derived(books[cursor]);

	$effect(() => {
		const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => {
			plain = motion.matches;
		};
		sync();
		motion.addEventListener('change', sync);
		return () => motion.removeEventListener('change', sync);
	});

	function shift(i: number) {
		if (total === 0) return 0;
		let delta = i - cursor;
		const half = Math.floor(total / 2);
		if (delta > half) delta -= total;
		if (delta < -half) delta += total;
		return delta;
	}

	function go(delta: number) {
		if (total === 0) return;
		index = (index + delta + total) % total;
	}

	function onKey(event: KeyboardEvent) {
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			go(1);
		}
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			go(-1);
		}
		if (event.key === 'Home') {
			event.preventDefault();
			index = 0;
		}
		if (event.key === 'End') {
			event.preventDefault();
			index = total - 1;
		}
	}

	function pointerDown(event: PointerEvent) {
		originX = event.clientX;
		dragged = false;
		skipClick = false;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function pointerMove(event: PointerEvent) {
		if (Math.abs(event.clientX - originX) > 10) dragged = true;
	}

	function pointerUp(event: PointerEvent) {
		const dx = event.clientX - originX;
		if (dx > 52) {
			skipClick = true;
			go(-1);
		} else if (dx < -52) {
			skipClick = true;
			go(1);
		}
	}

	function choose(i: number, event: MouseEvent) {
		if (skipClick || dragged) {
			event.preventDefault();
			skipClick = false;
			dragged = false;
			return;
		}
		if (i !== cursor) {
			event.preventDefault();
			index = i;
		}
	}

	let shelf = $state<HTMLElement | undefined>();
	let stage = $state<HTMLElement | undefined>();

	$effect(() => {
		const node = shelf;
		if (!node) return;
		node.addEventListener('keydown', onKey);
		return () => node.removeEventListener('keydown', onKey);
	});

	$effect(() => {
		const node = stage;
		if (!node) return;
		node.addEventListener('pointerdown', pointerDown);
		node.addEventListener('pointermove', pointerMove);
		node.addEventListener('pointerup', pointerUp);
		node.addEventListener('pointercancel', pointerUp);
		return () => {
			node.removeEventListener('pointerdown', pointerDown);
			node.removeEventListener('pointermove', pointerMove);
			node.removeEventListener('pointerup', pointerUp);
			node.removeEventListener('pointercancel', pointerUp);
		};
	});
</script>

{#if books.length === 0}
	<!-- empty -->
{:else if plain}
	<div class="cover-rail">
		{#each books as book (book.id)}
			<BookCover {book} size="rail" />
		{/each}
	</div>
{:else}
	<div
		bind:this={shelf}
		class="complete-shelf"
		role="region"
		aria-roledescription="carousel"
		aria-label="Pracovné zväzky vo fonde"
	>
		<div class="shelf-tools">
			{#if total > 1}
				<button type="button" class="shelf-nudge" onclick={() => go(-1)} aria-label="Predošlý zväzok">
					<ChevronLeftIcon />
				</button>
			{/if}
			<p class="shelf-count">
				<span>{String(cursor + 1).padStart(2, '0')}</span>
				<i>/</i>
				{String(total).padStart(2, '0')}
			</p>
			{#if total > 1}
				<button type="button" class="shelf-nudge" onclick={() => go(1)} aria-label="Ďalší zväzok">
					<ChevronRightIcon />
				</button>
			{/if}
		</div>

		<div class="shelf-stage" bind:this={stage}>
			<div class="shelf-ring">
				{#each books as book, i (book.id)}
					{@const offset = shift(i)}
					{@const tone = jacketFor(book)}
					{@const on = i === cursor}
					{#if Math.abs(offset) <= 4}
						<a
							class="volume no-underline"
							class:is-on={on}
							class:is-out={book.copiesAvailable === 0}
							style="--shift: {offset}; --spine: {book.category.accent}; --jacket: {tone.bg}; z-index: {12 - Math.abs(offset)}"
							href={resolve('/books/[id]', { id: book.id })}
							aria-current={on ? 'true' : undefined}
							aria-label="{book.title}, {authorLine(book.authors)}"
							onclick={(event) => choose(i, event)}
						>
							<span class="volume-spine">
								<em>{book.category.code}</em>
							</span>
							<span class="volume-cover">
								<OptimizedImage
									src={tone.photo}
									preset="rail"
									eager={on}
									class="volume-photo"
									fallbackLabel={book.title}
									fallbackBg={tone.bg}
									fallbackFg={tone.fg}
								/>
								<span class="volume-shade"></span>
								{#if on}
									<span class="volume-title">{book.title}</span>
								{/if}
							</span>
							<span class="volume-pages"></span>
						</a>
					{/if}
				{/each}
			</div>
			<div class="shelf-plank"></div>
			<div class="shelf-grain"></div>
		</div>

		{#if current}
			<div class="shelf-card" aria-live="polite">
				<p class="shelf-kicker">
					{current.category.name}
					<span>{current.callNumber}</span>
				</p>
				<h3>{current.title}</h3>
				<p class="shelf-by">{authorLine(current.authors)}</p>
				<div class="shelf-meta">
					<b class:is-out={current.copiesAvailable === 0}>
						{current.copiesAvailable > 0
							? copiesLabel(current.copiesAvailable, current.copiesTotal)
							: 'Práve vypožičaná'}
					</b>
					<a class="shelf-open no-underline" href={resolve('/books/[id]', { id: current.id })}>
						Otvoriť zväzok
					</a>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.complete-shelf {
		--well: #e7e1d4;
		--well-lit: rgb(255 252 244 / 0.72);
		--well-shade: rgb(72 52 36 / 0.1);
		--stage-ring: rgb(90 68 42 / 0.16);
		--plank-hi: #f3ddb0;
		--plank-mid: #c4964a;
		--plank-lo: #5a3c1c;
		--grain: rgb(72 52 36 / 0.32);
		--grain-blend: multiply;
		--grain-opacity: 0.16;
		--vol-shadow: 10px 20px 32px rgb(48 34 22 / 0.2);
		--label: color-mix(in srgb, var(--foreground, #3c2a21) 78%, var(--background, #f6f0e6));
		--ok-bg: #d7e4c4;
		--ok-fg: #1f3324;
		--out-bg: #ebe3d4;
		--out-fg: #6e5f50;
		overflow: clip;
		padding-top: 0.15rem;
		outline: none;
	}

	.shelf-tools {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.85rem;
		margin-bottom: 0.85rem;
	}

	.shelf-nudge {
		display: grid;
		place-items: center;
		width: 2.4rem;
		height: 2.4rem;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: var(--nudge-bg, var(--ink, var(--foreground, #3c2a21)));
		color: var(--nudge-fg, var(--page, var(--background, #f6f0e6)));
		box-shadow: var(--nudge-ring, none);
		cursor: pointer;
	}

	.shelf-nudge:hover {
		opacity: 0.82;
	}

	.shelf-nudge :global(svg) {
		width: 1.05rem;
		height: 1.05rem;
	}

	.shelf-count {
		margin: 0;
		min-width: 4.6rem;
		color: var(--label);
		font-family: 'IBM Plex Sans', sans-serif;
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-align: center;
	}

	.shelf-count span {
		color: var(--foreground, #3c2a21);
	}

	.shelf-count i {
		margin: 0 0.28rem;
		font-style: normal;
		opacity: 0.7;
	}

	.shelf-stage {
		position: relative;
		overflow: hidden;
		height: 18.6rem;
		border-radius: 1.15rem 1.15rem 0.4rem 0.4rem;
		background:
			radial-gradient(95% 70% at 50% -8%, var(--well-lit), transparent 56%),
			linear-gradient(180deg, var(--well-shade), transparent 42%),
			var(--well);
		box-shadow: inset 0 0 0 1px var(--stage-ring);
		perspective: 1280px;
		perspective-origin: 50% 42%;
		touch-action: pan-y;
		cursor: grab;
		user-select: none;
	}

	.shelf-stage:active {
		cursor: grabbing;
	}

	.shelf-ring {
		position: relative;
		height: 15.4rem;
		transform-style: preserve-3d;
	}

	.volume {
		position: absolute;
		top: 1.15rem;
		left: 50%;
		width: 7.4rem;
		height: 11.6rem;
		margin-left: -3.7rem;
		transform-style: preserve-3d;
		transform:
			translateX(calc(var(--shift) * 4.7rem))
			translateZ(calc(-1 * var(--shift) * var(--shift) * 2.8rem))
			rotateY(calc(var(--shift) * -42deg))
			scale(calc(1 - abs(var(--shift)) * 0.07));
		filter: brightness(calc(1 - abs(var(--shift)) * 0.14));
		transition:
			transform 0.62s cubic-bezier(0.22, 1, 0.36, 1),
			filter 0.62s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.volume.is-on {
		transform: translateX(0) translateY(-0.55rem) translateZ(3.6rem) rotateY(-7deg) scale(1.04);
		filter: none;
		cursor: pointer;
	}

	.volume-cover,
	.volume-spine,
	.volume-pages {
		position: absolute;
		top: 0;
		height: 100%;
		backface-visibility: hidden;
	}

	.volume-cover {
		inset: 0;
		overflow: hidden;
		border-radius: 2px 5px 5px 2px;
		background: var(--jacket);
		box-shadow:
			var(--vol-shadow),
			inset 0 0 0 1px rgb(255 255 255 / 0.1);
		transform: translateZ(0.48rem);
	}

	.volume-cover :global(.volume-photo),
	.volume-cover :global(.opt-image) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		aspect-ratio: auto !important;
	}

	.volume-shade {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(90deg, rgb(0 0 0 / 0.28), transparent 18%, rgb(255 255 255 / 0.08) 72%),
			linear-gradient(180deg, transparent 46%, rgb(0 0 0 / 0.55));
		pointer-events: none;
	}

	.volume-title {
		position: absolute;
		right: 0.55rem;
		bottom: 0.55rem;
		left: 0.55rem;
		color: #fffaf3;
		font-family: 'Fraunces', serif;
		font-size: 0.72rem;
		font-weight: 650;
		letter-spacing: -0.03em;
		line-height: 1.15;
		text-shadow: 0 1px 8px rgb(0 0 0 / 0.45);
	}

	.volume-spine {
		left: 0;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		width: 0.95rem;
		padding-bottom: 0.55rem;
		background:
			linear-gradient(90deg, rgb(0 0 0 / 0.35), transparent 40%, rgb(255 255 255 / 0.18)),
			var(--spine);
		transform: rotateY(-90deg);
		transform-origin: left center;
	}

	.volume-spine em {
		color: #fffaf3;
		font-family: 'IBM Plex Sans', sans-serif;
		font-size: 0.42rem;
		font-style: normal;
		font-weight: 700;
		letter-spacing: 0.14em;
		writing-mode: vertical-rl;
		transform: rotate(180deg);
	}

	.volume-pages {
		right: 0;
		width: 0.42rem;
		background: repeating-linear-gradient(
			180deg,
			#f7f1e6 0 1px,
			#e7dcc8 1px 2px,
			#f3ead8 2px 3px
		);
		transform: rotateY(90deg);
		transform-origin: right center;
		box-shadow: inset -1px 0 0 rgb(60 42 33 / 0.12);
	}

	.volume.is-out .volume-cover {
		filter: grayscale(0.35) saturate(0.7);
	}

	.shelf-plank {
		position: absolute;
		right: 6%;
		bottom: 0.55rem;
		left: 6%;
		height: 0.72rem;
		border-radius: 2px;
		background: linear-gradient(180deg, var(--plank-hi), var(--plank-mid) 48%, var(--plank-lo));
		box-shadow: 0 10px 0 rgb(60 42 33 / 0.14);
	}

	.shelf-grain {
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: var(--grain-opacity);
		mix-blend-mode: var(--grain-blend);
		background-image: radial-gradient(circle at 1px 1px, var(--grain) 0.6px, transparent 0.7px);
		background-size: 3px 3px;
	}

	.shelf-card {
		display: grid;
		gap: 0.28rem;
		margin-top: 1.25rem;
		padding: 0.15rem 0.15rem 0.35rem;
		text-align: center;
	}

	.shelf-kicker,
	.shelf-open,
	.shelf-meta b {
		font-family: 'IBM Plex Sans', sans-serif;
	}

	.shelf-kicker {
		margin: 0;
		color: var(--label);
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.shelf-kicker span {
		margin-left: 0.55rem;
		letter-spacing: 0.04em;
		text-transform: none;
		opacity: 0.92;
	}

	.shelf-card h3 {
		margin: 0.15rem 0 0;
		overflow-wrap: anywhere;
		color: var(--ink, var(--foreground, #3c2a21));
		font-family: 'Fraunces', serif;
		font-size: clamp(1.35rem, 4.6vw, 2.05rem);
		font-weight: 650;
		letter-spacing: -0.03em;
		line-height: 1.12;
	}

	.shelf-by {
		margin: 0.15rem 0 0;
		color: var(--label);
		font-family: 'Newsreader', serif;
		font-size: 1rem;
	}

	.shelf-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.65rem;
		margin-top: 0.7rem;
	}

	.shelf-meta b {
		padding: 0.28rem 0.62rem;
		border-radius: 999px;
		background: var(--ok-bg);
		color: var(--ok-fg);
		font-size: 0.72rem;
		font-weight: 700;
	}

	.shelf-meta b.is-out {
		background: var(--out-bg);
		color: var(--out-fg);
	}

	.shelf-open {
		display: inline-flex;
		align-items: center;
		height: 2.4rem;
		padding: 0 1.05rem;
		border-radius: 999px;
		background: var(--ink, var(--foreground, #3c2a21));
		color: var(--page, var(--background, #f6f0e6));
		font-size: 0.84rem;
		font-weight: 600;
	}

	.shelf-open:hover {
		opacity: 0.86;
	}

	:global(html.dark) .shelf-open {
		background: #c45a38;
		color: #fff6ec;
	}

	:global(html.dark) .complete-shelf {
		--well: #0c0f14;
		--well-lit: rgb(170 196 214 / 0.07);
		--well-shade: rgb(0 0 0 / 0.5);
		--stage-ring: rgb(214 200 168 / 0.22);
		--plank-hi: #f0d08a;
		--plank-mid: #c4923a;
		--plank-lo: #6a4818;
		--grain: rgb(214 200 168 / 0.1);
		--grain-blend: overlay;
		--grain-opacity: 0.28;
		--vol-shadow: 8px 24px 40px rgb(0 0 0 / 0.62);
		--label: #eee4d6;
		--ok-bg: #45624c;
		--ok-fg: #f4f8ea;
		--out-bg: #3a342c;
		--out-fg: #efe6d8;
		--nudge-bg: #1a1814;
		--nudge-fg: #f3eadf;
		--nudge-ring: inset 0 0 0 1px rgb(243 234 223 / 0.28);
	}

	:global(html.dark) .shelf-plank {
		box-shadow:
			0 0 18px rgb(212 168 90 / 0.28),
			0 10px 0 rgb(0 0 0 / 0.4);
	}

	:global(html.dark) .volume {
		filter: brightness(calc(1 - abs(var(--shift)) * 0.08));
	}

	@media (min-width: 640px) {
		.shelf-stage {
			height: 22.5rem;
		}

		.shelf-ring {
			height: 18.6rem;
		}

		.volume {
			top: 1.35rem;
			width: 10.1rem;
			height: 15.2rem;
			margin-left: -5.05rem;
			transform:
				translateX(calc(var(--shift) * 6.5rem))
				translateZ(calc(-1 * var(--shift) * var(--shift) * 3.4rem))
				rotateY(calc(var(--shift) * -36deg))
				scale(calc(1 - abs(var(--shift)) * 0.06));
		}

		.volume.is-on {
			transform: translateX(0) translateY(-0.7rem) translateZ(5rem) rotateY(-8deg) scale(1.05);
		}

		.volume-title {
			font-size: 0.92rem;
		}
	}

	@media (min-width: 960px) {
		.volume {
			transform:
				translateX(calc(var(--shift) * 7.6rem))
				translateZ(calc(-1 * var(--shift) * var(--shift) * 3.8rem))
				rotateY(calc(var(--shift) * -32deg))
				scale(calc(1 - abs(var(--shift)) * 0.05));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.volume {
			transition: none;
		}
	}
</style>
