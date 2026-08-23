<script lang="ts">
	import { resolve } from '$app/paths';
	import { authorLine, copiesLabel, splitCallNumber } from '$lib/format';
	import { clothFor } from '$lib/cover';
	import type { CatalogBook } from '$lib/types';

	let { book }: { book: CatalogBook } = $props();

	const call = $derived(splitCallNumber(book.callNumber));
	const cloth = $derived(clothFor(book.id));
	const out = $derived(book.copiesAvailable === 0);
</script>

<a class="slip" href={resolve('/books/[id]', { id: book.id })}>
	<span class="slip-tab" style="background: {cloth.bg}"></span>
	<span class="slip-call">
		<i>{call.dept}</i>
		<b>{call.number}</b>
		<em>{call.cutter}</em>
	</span>
	<span class="slip-body">
		<strong>{book.title}</strong>
		<span>{authorLine(book.authors)}</span>
	</span>
	<span class="slip-mark" class:is-out={out}>{copiesLabel(book.copiesAvailable, book.copiesTotal)}</span>
</a>

<style>
	.slip {
		display: grid;
		grid-template-columns: 0.42rem 5.6rem minmax(0, 1fr);
		gap: 0.75rem 1rem;
		align-items: center;
		height: 100%;
		padding: 0 0.2rem 0 0;
		border-top: 1px dashed color-mix(in srgb, var(--foreground) 16%, transparent);
		text-decoration: none;
		color: inherit;
	}

	.slip-tab {
		align-self: stretch;
		width: 0.42rem;
		margin: 0.55rem 0;
		border-radius: 999px;
	}

	.slip-call {
		display: grid;
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		line-height: 1.15;
	}

	.slip-call i,
	.slip-call em {
		font-style: normal;
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted-foreground);
	}

	.slip-call b {
		font-size: 0.98rem;
		font-weight: 600;
	}

	.slip-body {
		display: grid;
		gap: 0.15rem;
		min-width: 0;
	}

	.slip-body strong {
		overflow: hidden;
		font-family: var(--font-display, Fraunces, serif);
		font-size: 1.12rem;
		font-weight: 650;
		letter-spacing: -0.03em;
		line-height: 1.15;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.slip:hover .slip-body strong {
		text-decoration: underline;
		text-underline-offset: 0.14em;
	}

	.slip-body span {
		overflow: hidden;
		font-family: var(--font-body, Newsreader, serif);
		font-size: 0.92rem;
		color: var(--muted-foreground);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.slip-mark {
		grid-column: 3;
		justify-self: start;
		padding: 0.22rem 0.55rem;
		border-radius: 999px;
		background: color-mix(in srgb, #1e6b3c 16%, var(--card));
		color: #1e6b3c;
		font-family: var(--font-sans, 'IBM Plex Sans', sans-serif);
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.slip-mark.is-out {
		background: color-mix(in srgb, #c43a2a 16%, var(--card));
		color: #c43a2a;
	}

	:global(.dark) .slip-mark {
		background: color-mix(in srgb, #2f8a4f 28%, transparent);
		color: #b7e0c2;
	}

	:global(.dark) .slip-mark.is-out {
		background: color-mix(in srgb, #e25a48 26%, transparent);
		color: #f3c2ba;
	}

	@media (min-width: 640px) {
		.slip {
			grid-template-columns: 0.42rem 5.8rem minmax(0, 1fr) auto;
		}

		.slip-mark {
			grid-column: auto;
			justify-self: end;
		}
	}
</style>
