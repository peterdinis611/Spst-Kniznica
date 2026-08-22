<script lang="ts">
	import { resolve } from '$app/paths';
	import { authorLine, booksLabel, initials } from '$lib/format';
	import { authorSwatch, jacketFor } from '$lib/cover';
	import CoverRail from '$lib/components/CoverRail.svelte';
	import OptimizedImage from '$lib/components/OptimizedImage.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const featured = $derived(data.featured);
	const authors = $derived(
		[...data.authors].sort((a, b) => b.bookCount - a.bookCount).slice(0, 5)
	);
	const railBooks = $derived(data.books.slice(0, 10));
</script>

<Seo
	title="Objavovať"
	description="Odporúčané knihy, police odborov a novinky vo fonde školskej knižnice SPŠT."
/>

<div class="discover">
	<p class="discover-ticker">
		{data.stats.available} voľných výtlačkov
		<span aria-hidden="true">·</span>
		{data.stats.books} zväzkov vo fonde
	</p>

	<section class="discover-stage">
		{#if featured}
			{@const jacket = jacketFor(featured)}
			<article class="discover-hero">
				<div class="discover-copy">
					<p class="discover-kicker">Dnes vo fonde · {featured.callNumber}</p>
					<h2>{featured.title}</h2>
					<p class="discover-lead">
						<span>{authorLine(featured.authors)}</span>
						{featured.category.name}
					</p>
					<div class="discover-cta">
						<a class="hall-btn no-underline" href={resolve('/knihy/[id]', { id: featured.id })}>
							Otvoriť kartu
						</a>
						<a class="hall-ghost no-underline" href={resolve('/knihy')}>Celý katalóg</a>
					</div>
					<span class="discover-stamp" class:is-out={featured.copiesAvailable === 0}>
						{featured.copiesAvailable > 0 ? 'Voľná' : 'Vonku'}
					</span>
				</div>
				<a class="discover-art no-underline" href={resolve('/knihy/[id]', { id: featured.id })}>
					<OptimizedImage
						src={jacket.photo}
						preset="hero"
						eager
						class="size-full min-h-52"
						fallbackLabel={featured.title}
						fallbackBg={jacket.bg}
						fallbackFg={jacket.fg}
					/>
				</a>
			</article>
		{/if}

		<aside class="discover-side">
			<p class="discover-kicker">Menný katalóg</p>
			<h2>Autori vo fonde</h2>
			<ul>
				{#each authors as author, i (author.id)}
					<li>
						<a class="discover-author no-underline" href={resolve('/autori/[slug]', { slug: author.slug })}>
							<span class="discover-rank">{String(i + 1).padStart(2, '0')}</span>
							<Avatar class="size-9">
								<AvatarFallback
									class="text-[0.7rem] font-bold text-[#fffaf3]"
									style="background: {authorSwatch(author.id)}"
								>
									{initials(author.name)}
								</AvatarFallback>
							</Avatar>
							<span class="discover-author-copy">
								<strong>{author.name}</strong>
								<em>{booksLabel(author.bookCount)}</em>
							</span>
						</a>
					</li>
				{/each}
			</ul>
			<a class="hall-btn hall-btn-block no-underline" href={resolve('/autori')}>Celý zoznam autorov</a>
		</aside>
	</section>

	<section class="discover-block">
		<div class="discover-head">
			<div>
				<p class="discover-kicker">Signatúry</p>
				<h2>Odbory na polici</h2>
			</div>
			<a class="hall-btn no-underline" href={resolve('/odbory')}>Všetky odbory</a>
		</div>
		<div class="discover-depts">
			{#each data.categories as cat (cat.id)}
				<a class="discover-dept no-underline" href={resolve('/odbory/[slug]', { slug: cat.slug })}>
					<span class="discover-dept-spine" style="background: {cat.accent}"></span>
					<b>{cat.code}</b>
					<strong>{cat.name}</strong>
					<em>{booksLabel(cat.bookCount)}</em>
				</a>
			{/each}
		</div>
	</section>

	<section class="discover-block">
		<div class="discover-head">
			<div>
				<p class="discover-kicker">Novinky vo fonde</p>
				<h2>Učebnice, príručky a normy.</h2>
			</div>
			<a class="hall-btn no-underline" href={resolve('/knihy')}>Celý katalóg</a>
		</div>
		<CoverRail books={railBooks} />
	</section>
</div>

<style>
	.discover {
		--rise: cubic-bezier(0.22, 1, 0.36, 1);
	}

	.discover-ticker {
		margin: 0 0 1.5rem;
		color: var(--muted-foreground);
		font-family: var(--font-display);
		font-size: 0.82rem;
		font-weight: 600;
		font-style: italic;
		letter-spacing: 0.02em;
		animation: discover-rise 0.55s var(--rise) both;
	}

	.discover-ticker span {
		margin: 0 0.45rem;
		font-style: normal;
		color: var(--copper);
	}

	.discover-stage {
		display: grid;
		gap: 1.15rem;
		animation: discover-rise 0.7s var(--rise) 0.06s both;
	}

	.discover-hero {
		display: grid;
		overflow: hidden;
		min-height: 19rem;
		border-radius: 1.15rem;
		background: var(--forest);
		color: #fffaf3;
		box-shadow: 0 22px 48px rgb(27 61 50 / 0.16);
	}

	.discover-copy {
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		gap: 0.85rem;
		padding: 1.7rem 1.5rem 1.55rem;
		padding-right: 6rem;
		background:
			radial-gradient(circle at 0% 110%, rgb(212 106 30 / 0.22), transparent 46%),
			var(--forest);
	}

	.discover-kicker {
		margin: 0;
		color: var(--copper);
		font-family: var(--font-display);
		font-size: 0.8rem;
		font-weight: 600;
		font-style: italic;
		letter-spacing: 0.02em;
	}

	.discover-copy h2 {
		margin: 0;
		max-width: 12ch;
		font-size: clamp(2rem, 4vw, 3.15rem);
		font-weight: 700;
		letter-spacing: -0.03em;
		line-height: 1.02;
		font-variation-settings: 'SOFT' 45, 'WONK' 1;
	}

	.discover-lead {
		margin: 0;
		max-width: 32ch;
		color: #c5d4cc;
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.discover-lead span {
		display: block;
		color: #f0c14b;
		font-weight: 600;
	}

	.discover-cta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		margin-top: 0.45rem;
	}

	.discover-stamp {
		position: absolute;
		top: 1.15rem;
		right: 1.1rem;
		display: grid;
		place-items: center;
		width: 4.35rem;
		height: 4.35rem;
		border: 2px solid #f0c14b;
		border-radius: 999px;
		color: #f0c14b;
		font-family: var(--font-display);
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		transform: rotate(-14deg);
		box-shadow: inset 0 0 0 3px rgb(240 193 75 / 0.35);
	}

	.discover-stamp.is-out {
		border-color: #c5d4cc;
		color: #c5d4cc;
		box-shadow: inset 0 0 0 3px rgb(197 212 204 / 0.28);
	}

	.discover-art {
		position: relative;
		display: block;
		overflow: hidden;
		min-height: 14rem;
		background: var(--forest-deep);
	}

	.discover-art::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		z-index: 1;
		width: 5.5rem;
		background: linear-gradient(90deg, var(--forest), transparent);
		pointer-events: none;
	}

	.discover-art :global(.opt-image) {
		height: 100%;
		min-height: 14rem;
		aspect-ratio: auto;
		transition: transform 0.75s var(--rise);
	}

	.discover-art:hover :global(.opt-image) {
		transform: scale(1.06);
	}

	.discover-side {
		padding: 1.25rem 1.15rem 1.2rem;
		border-radius: 1.15rem;
		background: var(--card);
		box-shadow: 0 18px 40px rgb(28 34 48 / 0.06);
	}

	.discover-side h2,
	.discover-head h2 {
		margin: 0.2rem 0 0;
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		font-variation-settings: 'SOFT' 45, 'WONK' 1;
	}

	.discover-side ul {
		display: grid;
		margin: 0.7rem 0 0;
		padding: 0;
		list-style: none;
	}

	.discover-author {
		display: grid;
		grid-template-columns: 1.5rem auto minmax(0, 1fr);
		align-items: center;
		gap: 0.7rem;
		padding: 0.62rem 0.1rem;
		border-bottom: 1px solid var(--line);
		color: inherit;
	}

	.discover-author:hover strong {
		color: var(--copper);
	}

	.discover-rank {
		color: var(--copper);
		font-family: var(--font-display);
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.06em;
	}

	.discover-author-copy {
		display: grid;
		min-width: 0;
	}

	.discover-author strong {
		overflow: hidden;
		font-size: 0.88rem;
		font-weight: 700;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: color 0.2s ease;
	}

	.discover-author em {
		color: var(--muted-foreground);
		font-size: 0.72rem;
		font-style: italic;
	}

	.discover-block {
		margin-top: 2.4rem;
		animation: discover-rise 0.7s var(--rise) 0.14s both;
	}

	.discover-block:last-child {
		animation-delay: 0.22s;
	}

	.discover-head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 0.9rem 1.2rem;
		margin-bottom: 1.15rem;
	}

	.discover-head h2 {
		max-width: 18ch;
		font-size: clamp(1.55rem, 2.8vw, 2.05rem);
	}

	.discover-depts {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.85rem;
	}

	.discover-dept {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.28rem;
		overflow: hidden;
		min-height: 8.4rem;
		padding: 1.05rem 1rem 1rem 1.2rem;
		border-radius: 1.05rem;
		background: var(--card);
		color: inherit;
		box-shadow: 0 12px 28px rgb(28 34 48 / 0.05);
		transition:
			transform 0.28s var(--rise),
			box-shadow 0.28s var(--rise);
	}

	.discover-dept-spine {
		position: absolute;
		top: 0.7rem;
		bottom: 0.7rem;
		left: 0;
		width: 0.38rem;
		border-radius: 0 999px 999px 0;
	}

	.discover-dept b {
		color: var(--copper);
		font-family: var(--font-display);
		font-size: 1.35rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		line-height: 1;
	}

	.discover-dept strong {
		margin-top: auto;
		font-size: 0.95rem;
		font-weight: 700;
	}

	.discover-dept em {
		color: var(--muted-foreground);
		font-size: 0.75rem;
		font-style: italic;
	}

	.discover-dept:hover {
		transform: translateY(-4px);
		box-shadow: 0 18px 36px rgb(28 34 48 / 0.1);
	}

	@keyframes discover-rise {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (max-width: 779px) {
		.discover-copy {
			padding-top: 5.8rem;
			padding-right: 1.5rem;
		}
	}

	@media (min-width: 720px) {
		.discover-depts {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}

	@media (min-width: 780px) {
		.discover-hero {
			grid-template-columns: 1.08fr 0.92fr;
		}

		.discover-art {
			min-height: 100%;
		}
	}

	@media (min-width: 1100px) {
		.discover-stage {
			grid-template-columns: minmax(0, 1fr) 17.4rem;
			align-items: stretch;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.discover-ticker,
		.discover-stage,
		.discover-block,
		.discover-art :global(.opt-image) {
			animation: none;
			transition: none;
		}
	}
</style>
