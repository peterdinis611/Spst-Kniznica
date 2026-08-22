<script lang="ts">
	import { resolve } from '$app/paths';

	type ShelfBook = { id: string; title: string };

	let { books }: { books: ShelfBook[] } = $props();

	const palette = [
		'#d4a24a',
		'#7d96a8',
		'#c56a4a',
		'#8fa37a',
		'#e8d3b0',
		'#5c3d2e',
		'#b08968',
		'#4f6d7a',
		'#9a7b4f',
		'#c9896a'
	];

	const layout = [
		[0, 1, 2, 3, 4, 5, 6, 7],
		[8, 9, 10, 11, 12, 13, 14],
		[15, 16, 17, 18, 19, 20, 21]
	];

	const tipIndexes = [1, 9, 14, 19, 24];

	const widths = [0.78, 0.58, 0.7, 0.5, 0.82, 0.56, 0.66, 0.6, 0.74, 0.52, 0.8, 0.64, 0.7, 0.54, 0.76, 0.62, 0.72, 0.58, 0.84, 0.5, 0.68, 0.6];
	const heights = [3.4, 4.1, 3.6, 4.6, 3.3, 4.2, 3.8, 4.4, 3.5, 4.5, 3.2, 4.0, 3.9, 4.3, 3.6, 4.15, 3.45, 4.55, 3.7, 4.25, 3.85, 4.05];

	let active = $state<string | null>(null);

	function bookAt(index: number) {
		if (books.length === 0) return null;
		return books[index % books.length];
	}
</script>

<div class="folio-shelf" role="group" aria-label="Police vo fonde" onmouseleave={() => (active = null)}>
	{#each [0, 1] as bay (bay)}
		<div class="folio-bay" style="--delay: {0.16 + bay * 0.08}s">
			<div class="folio-rail"></div>
			<div class="folio-well">
				{#each layout as row, rowIndex (rowIndex)}
					<div class="folio-row">
						<div class="folio-books">
							{#each row as slot (slot)}
								{@const index = bay * 11 + slot}
								{@const book = bookAt(index)}
								{@const isTip = tipIndexes.includes(index)}
								{#if book}
									<a
										class="folio-spine no-underline"
										class:is-tip={isTip}
										class:is-on={active === book.id}
										href={resolve('/knihy/[id]', { id: book.id })}
										style="--w: {widths[index % widths.length]}rem; --h: {heights[index % heights.length]}rem; --c: {palette[index % palette.length]}"
										title={book.title}
										onmouseenter={() => (active = book.id)}
										onfocus={() => (active = book.id)}
									>
										<span class="folio-band"></span>
										<span class="sr-only">{book.title}</span>
									</a>
								{/if}
							{/each}
						</div>
						<div class="folio-plank"></div>
					</div>
				{/each}
			</div>
			<div class="folio-rail"></div>
		</div>
	{/each}

	{#each tipIndexes as index, i (index)}
		{@const book = bookAt(index)}
		{#if book}
			<a
				class="folio-tip no-underline tip-{i}"
				class:is-on={active === book.id}
				href={resolve('/knihy/[id]', { id: book.id })}
				onmouseenter={() => (active = book.id)}
				onfocus={() => (active = book.id)}
			>
				{book.title}
			</a>
		{/if}
	{/each}
</div>

<style>
	.folio-shelf {
		--wood: #c8a36d;
		--wood-deep: #9a7848;
		--wood-ink: #6f5330;
		position: relative;
		display: flex;
		justify-content: center;
		gap: 1.4rem;
		width: min(46rem, 100%);
		margin: 2.8rem auto 0;
		padding: 3rem 0 1.4rem;
		filter: drop-shadow(-20px 24px 0 rgb(60 42 33 / 0.09));
	}

	.folio-bay {
		display: grid;
		grid-template-columns: 0.85rem 1fr 0.85rem;
		width: min(18.5rem, 46vw);
		min-height: 19.5rem;
		padding-bottom: 0.6rem;
		background: var(--wood-deep);
		animation: folio-up 0.9s cubic-bezier(0.22, 1, 0.36, 1) var(--delay) both;
	}

	.folio-rail {
		background:
			linear-gradient(90deg, rgb(60 42 33 / 0.22), transparent 38%, rgb(255 244 220 / 0.2)),
			var(--wood-deep);
	}

	.folio-well {
		display: flex;
		flex-direction: column;
		padding: 0.5rem 0.4rem 0.25rem;
		background:
			linear-gradient(180deg, rgb(60 42 33 / 0.1), transparent 16%),
			#d8b67a;
	}

	.folio-row {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: flex-end;
		min-height: 5.8rem;
	}

	.folio-books {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 0.18rem;
		padding: 0 0.1rem 0.06rem;
	}

	.folio-spine {
		position: relative;
		display: block;
		overflow: hidden;
		width: var(--w);
		height: var(--h);
		border-radius: 2px 2px 0 0;
		background:
			linear-gradient(90deg, rgb(0 0 0 / 0.2), transparent 28%, rgb(255 255 255 / 0.2) 72%, rgb(0 0 0 / 0.08)),
			var(--c);
		box-shadow: 2px 0 0 rgb(60 42 33 / 0.1);
		transform-origin: bottom center;
		transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.folio-band {
		position: absolute;
		top: 28%;
		right: 0;
		left: 0;
		height: 3px;
		background: rgb(255 248 230 / 0.38);
	}

	.folio-spine:hover,
	.folio-spine.is-on {
		transform: translateY(-7px);
	}

	.folio-plank {
		height: 0.48rem;
		background: linear-gradient(180deg, #ead09a, var(--wood) 50%, var(--wood-ink));
		box-shadow: 0 5px 0 rgb(60 42 33 / 0.14);
	}

	.folio-tip {
		position: absolute;
		z-index: 2;
		padding: 0.44rem 0.78rem;
		border-radius: 999px;
		background: #fffdf8;
		color: #3c2a21;
		font-family: 'IBM Plex Sans', sans-serif;
		font-size: 0.74rem;
		font-weight: 600;
		white-space: nowrap;
		box-shadow: 0 10px 24px rgb(60 42 33 / 0.1);
		animation: folio-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both;
	}

	.folio-tip::after {
		content: '';
		position: absolute;
		width: 0.55rem;
		height: 0.55rem;
		background: #fffdf8;
		transform: rotate(45deg);
	}

	.folio-tip.is-on {
		background: #3c2a21;
		color: #f7f1e8;
	}

	.folio-tip.is-on::after {
		background: #3c2a21;
	}

	.tip-0 {
		top: 0.1rem;
		left: 7%;
	}
	.tip-0::after {
		bottom: -0.2rem;
		left: 1.5rem;
	}

	.tip-1 {
		top: 38%;
		left: -0.4rem;
	}
	.tip-1::after {
		top: 50%;
		right: -0.18rem;
		margin-top: -0.22rem;
	}

	.tip-2 {
		top: 0.25rem;
		right: 4%;
	}
	.tip-2::after {
		bottom: -0.2rem;
		right: 1.7rem;
	}

	.tip-3 {
		top: 40%;
		right: -0.6rem;
	}
	.tip-3::after {
		top: 50%;
		left: -0.18rem;
		margin-top: -0.22rem;
	}

	.tip-4 {
		bottom: 0.55rem;
		right: 8%;
	}
	.tip-4::after {
		top: -0.18rem;
		right: 2rem;
	}

	@keyframes folio-up {
		from {
			opacity: 0;
			transform: translateY(18px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (max-width: 720px) {
		.folio-shelf {
			filter: drop-shadow(-10px 14px 0 rgb(60 42 33 / 0.08));
			padding-top: 0.6rem;
		}

		.tip-1,
		.tip-3 {
			display: none;
		}

		.folio-tip {
			font-size: 0.64rem;
			padding: 0.34rem 0.55rem;
		}
	}

	:global(.dark) .folio-shelf {
		--wood: #6d5334;
		--wood-deep: #4a3824;
		--wood-ink: #2c2014;
		filter: drop-shadow(-14px 18px 0 rgb(0 0 0 / 0.28));
	}

	:global(.dark) .folio-well {
		background: #7d6240;
	}

	:global(.dark) .folio-tip {
		background: #221c16;
		color: #f3eadf;
	}

	:global(.dark) .folio-tip::after {
		background: #221c16;
	}

	:global(.dark) .folio-tip.is-on {
		background: #f3eadf;
		color: #1a1612;
	}

	:global(.dark) .folio-tip.is-on::after {
		background: #f3eadf;
	}

	@media (prefers-reduced-motion: reduce) {
		.folio-bay,
		.folio-tip,
		.folio-spine {
			animation: none;
			transition: none;
		}
	}
</style>
