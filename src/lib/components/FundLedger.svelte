<script lang="ts">
	import { resolve } from '$app/paths';
	import { volumesLabel } from '$lib/format';
	import PrintJacket from './PrintJacket.svelte';
	import CatalogSlip from './CatalogSlip.svelte';
	import VirtualWindow from './VirtualWindow.svelte';
	import type { BookSlip, CategoryChip } from '$lib/types';

	let { books, categories }: { books: BookSlip[]; categories: CategoryChip[] } = $props();

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
	const virtual = $derived(count > 48);
	const tilts = [-7, 4, -3, 6, -5, 3];
	const rows = $derived(
		ledger.flatMap((group) => [
			{
				kind: 'head' as const,
				id: `head-${group.id}`,
				code: group.code,
				name: group.name,
				slug: group.slug,
				accent: group.accent,
				count: group.books.length
			},
			...group.books.map((item) => ({ kind: 'book' as const, id: item.id, book: item }))
		])
	);

	function rowSize(index: number) {
		return rows[index]?.kind === 'head' ? 72 : 88;
	}
</script>

<header class="mast">
	<div class="mast-copy hidden md:block">
		<p class="kicker">Register fondu</p>
		<h1>Všetky knihy.</h1>
		<p class="lede">
			Kartotéka podľa odboru — signatúra vľavo, chrbát na lístku. Otvor zväzok a uvidíš, či je voľný.
		</p>
	</div>
	<aside class="mast-count">
		<strong>{count < 100 ? String(count).padStart(2, '0') : count.toLocaleString('sk-SK')}</strong>
		<span>{volumesLabel(count)}</span>
		{#if virtual}
			<em>virtualizovaný register</em>
		{/if}
		<a href={resolve('/books')}>Do katalógu →</a>
	</aside>
</header>

{#if virtual}
	<VirtualWindow count={rows.length} estimateSize={rowSize}>
		{#snippet children({ row })}
			{@const item = rows[row.index]}
			{#if item?.kind === 'head'}
				<a
					class="lane-head"
					style="--accent: {item.accent}"
					href={resolve('/departments/[slug]', { slug: item.slug })}
				>
					<strong>{item.code}</strong>
					<span>{item.name}</span>
					<b>{item.count}</b>
				</a>
			{:else if item?.kind === 'book'}
				<CatalogSlip book={item.book} />
			{/if}
		{/snippet}
	</VirtualWindow>
{:else}
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

				<div class="slips">
					{#each group.books as book (book.id)}
						<CatalogSlip {book} />
					{/each}
				</div>
			</section>
		{/each}
	</div>
{/if}

<style>
	.mast {
		position: relative;
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.35rem 1rem;
		margin-bottom: 0.85rem;
		padding: 0 0 0.7rem;
		overflow: hidden;
		border-bottom: 1px solid color-mix(in srgb, var(--foreground) 14%, transparent);
	}

	.mast-copy {
		display: none;
	}

	.mast-count {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.35rem 0.65rem;
	}

	.mast-count strong {
		font-size: 1.25rem;
		line-height: 1;
		letter-spacing: -0.04em;
	}

	.mast-count em {
		display: none;
	}

	.mast::before {
		content: '';
		position: absolute;
		inset: -20% -8% auto auto;
		display: none;
		width: 14rem;
		height: 14rem;
		border: 3px solid color-mix(in srgb, var(--foreground) 10%, transparent);
		border-radius: 999px;
		transform: rotate(12deg);
		pointer-events: none;
	}

	.kicker {
		margin: 0;
		font-family: var(--font-sans, 'Bricolage Grotesque', sans-serif);
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--muted-foreground);
	}

	.mast h1 {
		margin: 0.35rem 0 0;
		max-width: 9ch;
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-size: clamp(2.15rem, 11vw, 4.6rem);
		font-weight: 800;
		line-height: 0.92;
		letter-spacing: -0.045em;
	}

	.lede {
		max-width: 38ch;
		margin: 0.75rem 0 0;
		font-family: var(--font-body, 'Literata', serif);
		font-size: 0.98rem;
		line-height: 1.45;
		color: var(--muted-foreground);
	}

	.mast-count strong {
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-weight: 800;
	}

	.mast-count span,
	.mast-count a {
		font-family: var(--font-sans, 'Bricolage Grotesque', sans-serif);
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
		.mast::before {
			display: block;
		}

		.mast {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: end;
			gap: 1.75rem;
			margin-bottom: 2.75rem;
			padding: 0.1rem 0 2.1rem;
		}

		.mast-copy {
			display: block;
		}

		.lede {
			margin-top: 1rem;
			font-size: 1.08rem;
		}

		.mast-count {
			display: grid;
			align-content: end;
			justify-items: end;
			gap: 0.45rem;
			text-align: right;
			padding-bottom: 0.2rem;
		}

		.mast-count strong {
			display: block;
			font-size: clamp(2.6rem, 8vw, 5.6rem);
			line-height: 0.92;
			letter-spacing: -0.06em;
			padding-bottom: 0.12em;
		}

		.mast-count em {
			display: block;
			font-family: var(--font-sans, 'Bricolage Grotesque', sans-serif);
			font-size: 0.68rem;
			font-style: normal;
			font-weight: 600;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			color: var(--muted-foreground);
		}
	}

	.folios {
		display: grid;
		gap: 2.75rem;
	}

	.folio {
		position: relative;
		padding: 0.85rem 0.85rem 0.25rem;
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
		min-width: 0;
		align-items: flex-end;
		justify-content: space-between;
		gap: 0.7rem 1rem;
		text-decoration: none;
		color: inherit;
	}

	.folio-code {
		min-width: 0;
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-size: clamp(2.4rem, 14vw, 5.4rem);
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
		max-width: 16ch;
		overflow: hidden;
		font-family: var(--font-sans, 'Bricolage Grotesque', sans-serif);
		font-size: 0.68rem;
		font-style: normal;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--muted-foreground);
	}

	.folio-meta b {
		font-family: var(--font-mono, 'Azeret Mono', monospace);
		font-size: 1.15rem;
		font-weight: 600;
	}

	.folio-fan {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: flex-end;
		min-width: 0;
		max-width: 100%;
		min-height: 7.6rem;
		margin: 0.7rem 0 0.2rem;
		padding: 0.3rem 0.1rem 0.6rem;
		overflow-x: auto;
		overscroll-behavior-x: contain;
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
	}

	.slips :global(.slip) {
		height: auto;
		padding-block: 0.85rem;
	}

	.lane-head {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: end;
		gap: 0.45rem 0.65rem;
		min-width: 0;
		height: 100%;
		padding-bottom: 0.35rem;
		border-bottom: 2px solid var(--accent);
		text-decoration: none;
		color: inherit;
	}

	.lane-head strong {
		min-width: 0;
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-size: 1.35rem;
		font-weight: 800;
		line-height: 0.8;
		letter-spacing: -0.05em;
		color: var(--accent);
	}

	.lane-head span {
		overflow: hidden;
		padding-bottom: 0.2rem;
		font-family: var(--font-sans, 'Bricolage Grotesque', sans-serif);
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--muted-foreground);
	}

	.lane-head b {
		padding-bottom: 0.15rem;
		font-family: var(--font-mono, 'Azeret Mono', monospace);
		font-size: 1rem;
	}

	:global(.dark) .lane-head strong {
		color: color-mix(in srgb, var(--accent) 55%, #f3eadf);
	}

	@media (min-width: 768px) {
		.folio-meta em {
			max-width: none;
			font-size: 0.72rem;
			letter-spacing: 0.14em;
		}

		.folio {
			padding: 1.15rem 1.15rem 0.4rem;
		}

		.folio-fan {
			min-height: 9.2rem;
			margin: 0.9rem 0 0.35rem;
			padding: 0.4rem 0.2rem 0.8rem;
		}

		.lane-head {
			grid-template-columns: 4.2rem minmax(0, 1fr) auto;
			gap: 0.85rem;
			padding-bottom: 0.45rem;
		}

		.lane-head strong {
			font-size: 2.1rem;
		}

		.lane-head span {
			font-size: 0.72rem;
			letter-spacing: 0.14em;
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
