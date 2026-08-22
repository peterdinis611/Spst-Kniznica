<script lang="ts">
	import { resolve } from '$app/paths';
	import { authorLine, booksLabel, initials } from '$lib/format';
	import { authorSwatch, jacketFor } from '$lib/cover';
	import SearchIcon from '@lucide/svelte/icons/search';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const featured = $derived(data.featured);
	let rail: HTMLDivElement | undefined = $state();

	function move(dir: number) {
		rail?.scrollBy({ left: dir * 280, behavior: 'smooth' });
	}
</script>

<svelte:head>
	<title>SPŠT knižnica</title>
</svelte:head>

<div class="landing">
	<header class="shop-nav">
		<a href={resolve('/')} class="shop-logo no-underline">
			<span class="shop-mark" aria-hidden="true">
				<i></i><i></i><i></i>
			</span>
			SPŠT knižnica
		</a>
		<nav class="shop-links">
			<a href={resolve('/')} aria-current="page">Domov</a>
			<a href={resolve('/discover')}>Objavovať</a>
			<a href={resolve('/knihy')}>Katalóg</a>
			<a href={resolve('/odbory')}>Odbory</a>
			<a href={resolve('/autori')}>Autori</a>
		</nav>
		<div class="shop-tools">
			<form class="shop-search" method="GET" action={resolve('/knihy')}>
				<SearchIcon class="size-4" />
				<input type="search" name="q" placeholder="Hľadať knihu…" aria-label="Hľadať knihu" />
			</form>
			{#if data.user}
				<a class="shop-login no-underline" href={resolve('/vypozicky')}>Moje knihy</a>
			{:else}
				<a class="shop-login no-underline" href={resolve('/prihlasenie')}>Prihlásiť sa</a>
			{/if}
		</div>
	</header>

	<section class="shop-stage">
		<div class="shop-hero">
			<div class="shop-hero-copy">
				<p class="shop-kicker">Školský fond · pavilón B</p>
				<h1>Objav knižnicu plnú učebníc, noriem a príbehov pre SPŠT.</h1>
				<p class="shop-lead">
					Výpožička na 21 dní, naraz 5 kníh. Teraz {data.stats.available} voľných výtlačkov
					z {data.stats.books} zväzkov.
				</p>
				<div class="shop-cta">
					<a class="shop-btn no-underline" href={resolve('/discover')}>Otvoriť katalóg</a>
					{#if featured}
						<a
							class="shop-btn shop-btn-ghost no-underline"
							href={resolve('/knihy/[id]', { id: featured.id })}
						>
							Dnes: {featured.title}
						</a>
					{/if}
				</div>
				<div class="shop-dots" aria-hidden="true">
					<span class="is-on"></span><span></span><span></span>
				</div>
			</div>
			<div class="shop-hero-art">
				<svg class="shop-reader" viewBox="0 0 320 250" fill="none" aria-hidden="true">
					<ellipse cx="168" cy="228" rx="92" ry="11" fill="#e4e7ee" />

					<!-- standing hardcover -->
					<rect x="28" y="86" width="42" height="118" rx="6" fill="#1c2230" />
					<rect x="34" y="92" width="30" height="106" rx="3" fill="#e31b6d" />
					<rect x="64" y="92" width="8" height="106" fill="#f4efe4" />
					<rect x="34" y="108" width="30" height="5" fill="#e8a317" />
					<rect x="34" y="168" width="30" height="5" fill="#e8a317" />
					<circle cx="49" cy="142" r="7" fill="#fff" opacity="0.35" />

					<!-- cover under open book -->
					<path
						d="M86 54c0-14 12-22 28-22h92c16 0 28 8 28 22v132c0 16-14 28-32 28H118c-18 0-32-12-32-28V54Z"
						fill="#1c2230"
					/>

					<!-- left page -->
					<path
						d="M158 44H112c-16 0-26 8-26 20v112c0 14 12 22 28 22h44V44Z"
						fill="#fffaf6"
						stroke="#1c2230"
						stroke-width="5"
						stroke-linejoin="round"
					/>
					<!-- right page -->
					<path
						d="M158 44h50c16 0 26 8 26 20v112c0 14-12 22-28 22h-48V44Z"
						fill="#fff"
						stroke="#1c2230"
						stroke-width="5"
						stroke-linejoin="round"
					/>
					<!-- gutter -->
					<path d="M158 46v130" stroke="#e31b6d" stroke-width="5" stroke-linecap="round" />
					<path d="M158 46v130" stroke="#1c2230" stroke-width="1.5" opacity="0.35" />

					<!-- type lines -->
					<g fill="#d5d9e1">
						<rect x="100" y="68" width="44" height="5" rx="2.5" />
						<rect x="100" y="84" width="38" height="5" rx="2.5" />
						<rect x="100" y="100" width="42" height="5" rx="2.5" />
						<rect x="100" y="116" width="32" height="5" rx="2.5" />
						<rect x="100" y="132" width="40" height="5" rx="2.5" />
						<rect x="100" y="148" width="28" height="5" rx="2.5" />
						<rect x="172" y="68" width="42" height="5" rx="2.5" />
						<rect x="172" y="84" width="36" height="5" rx="2.5" />
						<rect x="172" y="100" width="44" height="5" rx="2.5" />
						<rect x="172" y="116" width="30" height="5" rx="2.5" />
						<rect x="172" y="132" width="38" height="5" rx="2.5" />
						<rect x="172" y="148" width="24" height="5" rx="2.5" />
					</g>

					<!-- page fold -->
					<path d="M218 176l16 22h-16z" fill="#f3d5e2" stroke="#1c2230" stroke-width="3.5" stroke-linejoin="round" />

					<!-- bookmark -->
					<path
						d="M158 28c0 0 0 18 0 18"
						stroke="#e31b6d"
						stroke-width="10"
						stroke-linecap="round"
					/>
					<path
						d="M152 28h12v78l-6-8-6 8V28Z"
						fill="#e31b6d"
					/>
					<path d="M152 28h12v10H152z" fill="#c7145c" />
				</svg>
			</div>
		</div>

		<aside class="shop-authors">
			<h2>Obľúbení autori</h2>
			<ul>
				{#each data.authors as author (author.id)}
					<li>
						<a class="shop-author no-underline" href={resolve('/autori/[slug]', { slug: author.slug })}>
							<span class="shop-avatar" style="background: {authorSwatch(author.id)}">
								{initials(author.name)}
							</span>
							<span class="shop-author-copy">
								<strong>{author.name}</strong>
								<em>{author.role} · {booksLabel(author.bookCount)}</em>
							</span>
							<span class="shop-score">{author.bookCount}</span>
						</a>
					</li>
				{/each}
			</ul>
			<a class="shop-more no-underline" href={resolve('/autori')}>Zobraziť všetkých</a>
		</aside>
	</section>

	<section class="shop-browse">
		<h2>Prezri fond učebníc, príručiek a povinnej literatúry.</h2>
		<a class="shop-btn no-underline" href={resolve('/knihy')}>Zobraziť všetky</a>

		<div class="shop-rail-wrap">
			<button type="button" class="shop-arrow shop-arrow-l" onclick={() => move(-1)} aria-label="Predošlé knihy">
				<ChevronLeftIcon />
			</button>
			<div class="shop-rail" bind:this={rail}>
				{#each data.books as book (book.id)}
					<a class="shop-card no-underline" href={resolve('/knihy/[id]', { id: book.id })}>
						<img src={jacketFor(book).photo} alt="" />
						<div class="shop-card-body">
							<h3>{book.title}</h3>
							<p>od <span>{authorLine(book.authors)}</span></p>
						</div>
						<span class="shop-badge" class:is-out={book.copiesAvailable === 0}>
							{book.copiesAvailable > 0 ? 'Voľná vo fonde' : 'Práve vypožičaná'}
						</span>
					</a>
				{/each}
			</div>
			<button type="button" class="shop-arrow shop-arrow-r" onclick={() => move(1)} aria-label="Ďalšie knihy">
				<ChevronRightIcon />
			</button>
		</div>
	</section>
</div>
