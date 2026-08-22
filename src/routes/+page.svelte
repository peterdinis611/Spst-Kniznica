<script lang="ts">
	import { resolve } from '$app/paths';
	import { authorLine, booksLabel, initials } from '$lib/format';
	import { authorSwatch, jacketFor } from '$lib/cover';
	import SearchIcon from '@lucide/svelte/icons/search';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import CatalogSearch from '$lib/components/CatalogSearch.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const featured = $derived(data.featured);
	let rail: HTMLDivElement | undefined = $state();
	let menuOpen = $state(false);
	let searchOpen = $state(false);
	let searchShortcut = $state('Ctrl K');

	onMount(() => {
		if (/Mac|iPhone|iPad/.test(navigator.platform)) searchShortcut = '⌘K';
	});

	function move(dir: number) {
		rail?.scrollBy({ left: dir * 280, behavior: 'smooth' });
	}

	function closeMenu() {
		menuOpen = false;
	}

	function openSearch() {
		menuOpen = false;
		searchOpen = true;
	}
</script>

<svelte:head>
	<title>SPŠT knižnica</title>
</svelte:head>

<div class="landing">
	<div class="landing-body" class:is-blurred={searchOpen}>
	<header class="hall-nav">
		<a href={resolve('/')} class="hall-logo no-underline">
			<span class="hall-mark" aria-hidden="true"></span>
			SPŠT knižnica
		</a>
		<nav class="hall-desk-links" aria-label="Hlavná navigácia">
			<a href={resolve('/')} aria-current="page">Domov</a>
			<a href={resolve('/discover')}>Objavovať</a>
			<a href={resolve('/knihy')}>Katalóg</a>
			<a href={resolve('/odbory')}>Odbory</a>
			<a href={resolve('/autori')}>Autori</a>
		</nav>
		<div class="hall-tools">
			<button type="button" class="hall-search-btn" onclick={openSearch}>
				<SearchIcon class="size-4" />
				<span>Hľadať knihu</span>
				<kbd>{searchShortcut}</kbd>
			</button>
			{#if data.user}
				<a class="hall-login no-underline" href={resolve('/vypozicky')}>Moje knihy</a>
			{:else}
				<a class="hall-login no-underline" href={resolve('/prihlasenie')}>Prihlásiť sa</a>
			{/if}
			<button
				type="button"
				class="hall-menu-btn"
				class:is-open={menuOpen}
				aria-controls="landing-menu"
				aria-expanded={menuOpen}
				aria-label={menuOpen ? 'Zavrieť menu' : 'Otvoriť menu'}
				onclick={() => (menuOpen = !menuOpen)}
			>
				<span></span>
				<span></span>
				<span></span>
			</button>
		</div>
	</header>

	{#if menuOpen}
		<nav
			class="hall-drawer"
			id="landing-menu"
			aria-label="Mobilné menu"
			transition:fly={{ y: -18, duration: 380, easing: cubicOut }}
		>
			<a href={resolve('/discover')} onclick={closeMenu}>Objavovať</a>
			<a href={resolve('/knihy')} onclick={closeMenu}>Katalóg</a>
			<a href={resolve('/odbory')} onclick={closeMenu}>Odbory</a>
			<a href={resolve('/autori')} onclick={closeMenu}>Autori</a>
			{#if data.user}
				<a href={resolve('/vypozicky')} onclick={closeMenu}>Moje knihy</a>
			{:else}
				<a href={resolve('/prihlasenie')} onclick={closeMenu}>Prihlásiť sa</a>
			{/if}
			<button type="button" class="hall-search-btn is-mobile" onclick={openSearch}>
				<SearchIcon class="size-4" />
				<span>Hľadať knihu</span>
			</button>
		</nav>
	{/if}

	<section class="hall-stage">
		<div class="hall-banner">
			<div class="hall-copy">
				<p class="hall-kicker">Školský fond · pavilón B</p>
				<h1>Objav knižnicu plnú učebníc, noriem a príbehov pre SPŠT.</h1>
				<p class="hall-lead">
					Výpožička na 21 dní, naraz 5 kníh. Teraz {data.stats.available} voľných výtlačkov
					z {data.stats.books} zväzkov.
				</p>
				<div class="hall-cta">
					<a class="hall-btn no-underline" href={resolve('/discover')}>Otvoriť katalóg</a>
					{#if featured}
						<a
							class="hall-ghost no-underline"
							href={resolve('/knihy/[id]', { id: featured.id })}
						>
							Dnes: {featured.title}
						</a>
					{/if}
				</div>
			</div>
			<div class="hall-art">
				<svg class="hall-book" viewBox="0 0 320 250" fill="none" aria-hidden="true">
					<ellipse cx="168" cy="228" rx="92" ry="11" fill="#dccfb6" />
					<rect x="28" y="86" width="42" height="118" rx="6" fill="#1b3d32" />
					<rect x="34" y="92" width="30" height="106" rx="3" fill="#d46a1e" />
					<rect x="64" y="92" width="8" height="106" fill="#f7f0e2" />
					<rect x="34" y="108" width="30" height="5" fill="#f0c14b" />
					<rect x="34" y="168" width="30" height="5" fill="#f0c14b" />
					<path
						d="M86 54c0-14 12-22 28-22h92c16 0 28 8 28 22v132c0 16-14 28-32 28H118c-18 0-32-12-32-28V54Z"
						fill="#1b3d32"
					/>
					<path
						d="M158 44H112c-16 0-26 8-26 20v112c0 14 12 22 28 22h44V44Z"
						fill="#f7f0e2"
						stroke="#1b3d32"
						stroke-width="5"
						stroke-linejoin="round"
					/>
					<path
						d="M158 44h50c16 0 26 8 26 20v112c0 14-12 22-28 22h-48V44Z"
						fill="#fffaf3"
						stroke="#1b3d32"
						stroke-width="5"
						stroke-linejoin="round"
					/>
					<path d="M158 46v130" stroke="#d46a1e" stroke-width="5" stroke-linecap="round" />
					<g fill="#cbbfa8">
						<rect x="100" y="68" width="44" height="5" rx="2.5" />
						<rect x="100" y="84" width="38" height="5" rx="2.5" />
						<rect x="100" y="100" width="42" height="5" rx="2.5" />
						<rect x="100" y="116" width="32" height="5" rx="2.5" />
						<rect x="172" y="68" width="42" height="5" rx="2.5" />
						<rect x="172" y="84" width="36" height="5" rx="2.5" />
						<rect x="172" y="100" width="44" height="5" rx="2.5" />
						<rect x="172" y="116" width="30" height="5" rx="2.5" />
					</g>
					<path d="M152 28h12v78l-6-8-6 8V28Z" fill="#d46a1e" />
				</svg>
			</div>
		</div>

		<aside class="hall-side">
			<h2>Autori vo fonde</h2>
			<ul>
				{#each data.authors as author (author.id)}
					<li>
						<a class="hall-author no-underline" href={resolve('/autori/[slug]', { slug: author.slug })}>
							<span class="hall-avatar" style="background: {authorSwatch(author.id)}">
								{initials(author.name)}
							</span>
							<span class="hall-author-copy">
								<strong>{author.name}</strong>
								<em>{booksLabel(author.bookCount)} vo fonde</em>
							</span>
						</a>
					</li>
				{/each}
			</ul>
			<a class="hall-btn hall-btn-block no-underline" href={resolve('/autori')}>Celý zoznam autorov</a>
		</aside>
	</section>

	<section class="hall-steps">
		<h2>Ako si požičiaš knihu</h2>
		<ol>
			<li>
				<span>01</span>
				<h3>Nájdi vo fonde</h3>
				<p>Hľadaj podľa názvu, autora alebo signatúry. Voľné výtlačky uvidíš hneď.</p>
			</li>
			<li>
				<span>02</span>
				<h3>Požičaj na účet</h3>
				<p>Prihlás sa a vezmi až 5 kníh. Lehota je 21 dní, bez poplatku.</p>
			</li>
			<li>
				<span>03</span>
				<h3>Vráť v pavilóne B</h3>
				<p>Odnes zväzok na 1. poschodie. Po—Pia 7:30—15:30.</p>
			</li>
		</ol>
	</section>

	<section class="hall-browse">
		<div class="hall-browse-head">
			<h2>Prezri fond učebníc, príručiek a povinnej literatúry.</h2>
			<a class="hall-btn no-underline" href={resolve('/knihy')}>Celý katalóg</a>
		</div>

		<div class="hall-rail-wrap">
			<button type="button" class="hall-arrow hall-arrow-l" onclick={() => move(-1)} aria-label="Predošlé knihy">
				<ChevronLeftIcon />
			</button>
			<div class="hall-rail" bind:this={rail}>
				{#each data.books as book (book.id)}
					<a class="hall-card no-underline" href={resolve('/knihy/[id]', { id: book.id })}>
						<img src={jacketFor(book).photo} alt="" />
						<div class="hall-card-body">
							<h3>{book.title}</h3>
							<p>od <span>{authorLine(book.authors)}</span></p>
						</div>
						<span class="hall-badge" class:is-out={book.copiesAvailable === 0}>
							{book.copiesAvailable > 0 ? 'Voľná vo fonde' : 'Práve vypožičaná'}
						</span>
					</a>
				{/each}
			</div>
			<button type="button" class="hall-arrow hall-arrow-r" onclick={() => move(1)} aria-label="Ďalšie knihy">
				<ChevronRightIcon />
			</button>
		</div>
	</section>

	<section class="hall-close">
		<div>
			<p class="hall-kicker">Čitateľský účet</p>
			<h2>Prihlás sa a kniha je tvoja na 21 dní.</h2>
		</div>
		<div class="hall-close-actions">
			{#if data.user}
				<a class="hall-btn no-underline" href={resolve('/vypozicky')}>Moje výpožičky</a>
			{:else}
				<a class="hall-btn no-underline" href={resolve('/prihlasenie')}>Prihlásiť sa</a>
			{/if}
			<a class="hall-ghost no-underline" href={resolve('/discover')}>Prezrieť fond</a>
		</div>
	</section>
	</div>

	<CatalogSearch items={data.searchIndex} bind:open={searchOpen} />
</div>
