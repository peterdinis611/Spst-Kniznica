<script lang="ts">
	import { resolve } from '$app/paths';
	import { authorLine, copiesLabel, splitCallNumber } from '$lib/format';
	import { clothFor } from '$lib/cover';
	import PrintJacket from './PrintJacket.svelte';
	import type { CatalogBook, CategoryRecord } from '$lib/types';

	let { books, categories }: { books: CatalogBook[]; categories: CategoryRecord[] } = $props();

	const ledger = $derived(
		categories
			.map((cat) => ({
				id: cat.id,
				code: cat.code,
				name: cat.name,
				slug: cat.slug,
				accent: cat.accent,
				books: books
					.filter((book) => book.category.id === cat.id)
					.toSorted((a, b) => a.title.localeCompare(b.title, 'sk'))
			}))
			.filter((group) => group.books.length > 0)
	);
	const count = $derived(books.length);
	const tilts = [-7, 4, -3, 6, -5, 3];
</script>

<header class="mast">
	<div class="mast-copy">
		<p class="kicker">Register fondu</p>
		<h1>Všetky knihy.</h1>
		<p class="lede">
			Kartotéka podľa odboru — signatúra vľavo, chrbát na lístku. Otvor zväzok a uvidíš, či je voľný.
		</p>
	</div>
	<aside class="mast-count">
		<strong>{String(count).padStart(2, '0')}</strong>
		<span>{count === 1 ? 'zväzok' : count < 5 ? 'zväzky' : 'zväzkov'}</span>
		<a href={resolve('/books')}>Do katalógu →</a>
	</aside>
</header>

<div class="folios">
	{#each ledger as group, gi (group.id)}
		<section
			class="folio"
			style="--accent: {group.accent}; --delay: {0.08 + gi * 0.07}s"
			aria-labelledby="folio-{group.id}"
		>
			<a class="folio-head" href={resolve('/departments/[slug]', { slug: group.slug })}>
				<span class="folio-code" id="folio-{group.id}">{group.code}</span>
				<span class="folio-meta">
					<em>{group.name}</em>
					<b>{group.books.length}</b>
				</span>
			</a>

			<div class="folio-fan" aria-hidden="true">
				{#each group.books as book, i (book.id)}
					<div class="fan-item" style="--tilt: {tilts[i % tilts.length]}deg">
						<PrintJacket {book} linked={false} size="thumb" class="hover:!transform-none" />
					</div>
				{/each}
			</div>

			<ol class="slips">
				{#each group.books as book (book.id)}
					{@const call = splitCallNumber(book.callNumber)}
					{@const cloth = clothFor(book.id)}
					{@const out = book.copiesAvailable === 0}
					<li>
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
							<span class="slip-mark" class:is-out={out}>
								{copiesLabel(book.copiesAvailable, book.copiesTotal)}
							</span>
						</a>
					</li>
				{/each}
			</ol>
		</section>
	{/each}
</div>

<style>
	.mast {
		position: relative;
		display: grid;
		gap: 1.75rem;
		margin-bottom: 2.75rem;
		padding: 0.2rem 0 2.1rem;
		overflow: hidden;
		border-bottom: 1px solid color-mix(in srgb, var(--foreground) 14%, transparent);
	}

	.mast::before {
		content: '';
		position: absolute;
		inset: -20% -8% auto auto;
		width: 14rem;
		height: 14rem;
		border: 3px solid color-mix(in srgb, var(--foreground) 10%, transparent);
		border-radius: 999px;
		transform: rotate(12deg);
		pointer-events: none;
	}

	.kicker {
		margin: 0;
		font-family: var(--font-sans, 'IBM Plex Sans', sans-serif);
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--muted-foreground);
	}

	.mast h1 {
		margin: 0.35rem 0 0;
		max-width: 9ch;
		font-family: var(--font-display, Fraunces, serif);
		font-size: clamp(2.6rem, 7vw, 4.6rem);
		font-weight: 800;
		line-height: 0.92;
		letter-spacing: -0.045em;
		font-variation-settings: 'SOFT' 18, 'WONK' 1;
	}

	.lede {
		max-width: 38ch;
		margin: 1rem 0 0;
		font-family: var(--font-body, Newsreader, serif);
		font-size: 1.08rem;
		line-height: 1.45;
		color: var(--muted-foreground);
	}

	.mast-count {
		display: grid;
		align-content: end;
		justify-items: start;
		gap: 0.15rem;
	}

	.mast-count strong {
		font-family: var(--font-display, Fraunces, serif);
		font-size: clamp(3.4rem, 8vw, 5.6rem);
		font-weight: 800;
		line-height: 0.8;
		letter-spacing: -0.06em;
	}

	.mast-count span,
	.mast-count a {
		font-family: var(--font-sans, 'IBM Plex Sans', sans-serif);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		text-decoration: none;
		color: var(--muted-foreground);
	}

	.mast-count a:hover {
		color: var(--foreground);
	}

	@media (min-width: 768px) {
		.mast {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: end;
		}

		.mast-count {
			justify-items: end;
			text-align: right;
			padding-bottom: 0.2rem;
		}
	}

	.folios {
		display: grid;
		gap: 2.75rem;
	}

	.folio {
		position: relative;
		padding: 1.15rem 1.15rem 0.4rem;
		border-radius: 1.15rem;
		background:
			linear-gradient(180deg, color-mix(in srgb, var(--accent) 14%, transparent), transparent 38%),
			color-mix(in srgb, var(--card) 88%, var(--accent));
		box-shadow: 0 18px 0 -12px color-mix(in srgb, var(--accent) 28%, transparent);
		animation: rise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
		animation-delay: var(--delay);
	}

	.folio::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		opacity: 0.18;
		background-image: repeating-linear-gradient(
			-18deg,
			transparent,
			transparent 10px,
			rgb(60 42 33 / 0.07) 10px,
			rgb(60 42 33 / 0.07) 11px
		);
	}

	:global(.dark) .folio {
		background:
			linear-gradient(180deg, color-mix(in srgb, var(--accent) 22%, transparent), transparent 42%),
			color-mix(in srgb, var(--card) 92%, #000);
		box-shadow: 0 18px 0 -12px rgb(0 0 0 / 0.35);
	}

	.folio-head {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		text-decoration: none;
		color: inherit;
	}

	.folio-code {
		font-family: var(--font-display, Fraunces, serif);
		font-size: clamp(3.4rem, 8vw, 5.4rem);
		font-weight: 800;
		line-height: 0.78;
		letter-spacing: -0.06em;
		color: var(--accent);
	}

	:global(.dark) .folio-code {
		color: color-mix(in srgb, var(--accent) 55%, #f3eadf);
	}

	.folio-meta {
		display: grid;
		justify-items: end;
		padding-bottom: 0.35rem;
	}

	.folio-meta em {
		font-family: var(--font-sans, 'IBM Plex Sans', sans-serif);
		font-size: 0.72rem;
		font-style: normal;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted-foreground);
	}

	.folio-meta b {
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 1.15rem;
		font-weight: 600;
	}

	.folio-fan {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: flex-end;
		min-height: 9.2rem;
		margin: 0.9rem 0 0.35rem;
		padding: 0.4rem 0.2rem 0.8rem;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.folio-fan::-webkit-scrollbar {
		display: none;
	}

	.fan-item {
		margin-left: -1.15rem;
		transform: rotate(var(--tilt)) translateY(0);
		transition: transform 0.28s ease;
		text-decoration: none;
	}

	.fan-item:first-child {
		margin-left: 0;
	}

	.fan-item:hover,
	.fan-item:focus-visible {
		z-index: 2;
		transform: rotate(0deg) translateY(-0.7rem);
	}

	.slips {
		position: relative;
		z-index: 1;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.slip {
		display: grid;
		grid-template-columns: 0.42rem 5.6rem minmax(0, 1fr);
		gap: 0.85rem 1rem;
		align-items: center;
		padding: 0.85rem 0.2rem 0.9rem 0;
		border-top: 1px dashed color-mix(in srgb, var(--foreground) 16%, transparent);
		text-decoration: none;
		color: inherit;
	}

	.slip-tab {
		align-self: stretch;
		width: 0.42rem;
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
		gap: 0.2rem;
		min-width: 0;
	}

	.slip-body strong {
		font-family: var(--font-display, Fraunces, serif);
		font-size: 1.18rem;
		font-weight: 650;
		letter-spacing: -0.03em;
		line-height: 1.15;
	}

	.slip:hover .slip-body strong {
		text-decoration: underline;
		text-underline-offset: 0.14em;
	}

	.slip-body span {
		font-family: var(--font-body, Newsreader, serif);
		font-size: 0.95rem;
		color: var(--muted-foreground);
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

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(1.1rem);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.folio {
			animation: none;
		}

		.fan-item,
		.fan-item:hover {
			transform: none;
			transition: none;
		}
	}
</style>
