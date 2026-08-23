<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import SearchIcon from '@lucide/svelte/icons/search';
	import UserIcon from '@lucide/svelte/icons/user';
	import CatalogSearch from '$lib/components/CatalogSearch.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import type { CatalogSearchItem } from '$lib/search';
	import type { Reader } from '$lib/types';
	import type { Snippet } from 'svelte';

	let {
		user,
		searchPreview,
		children
	}: {
		user: Reader;
		searchPreview: CatalogSearchItem[];
		children: Snippet;
	} = $props();

	let menuOpen = $state(false);
	let searchOpen = $state(false);
	const path = $derived(page.url.pathname);

	onMount(() => {
		const onKey = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				openSearch();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	function closeMenu() {
		menuOpen = false;
	}

	function openSearch() {
		menuOpen = false;
		searchOpen = true;
	}
</script>

<div class="landing">
	<div class="landing-body" class:is-blurred={searchOpen}>
		<header class="hall-nav">
			<a href={resolve('/')} class="hall-logo no-underline" aria-label="SPŠT knižnica">
				<BookOpenIcon class="size-6" />
			</a>
			<nav class="hall-desk-links" aria-label="Hlavná navigácia">
				<a href={resolve('/')} aria-current={path === '/' ? 'page' : undefined}>Fond</a>
				<a href={resolve('/discover')} aria-current={path.startsWith('/discover') ? 'page' : undefined}>
					Objavovať
				</a>
				<a href={resolve('/holdings')} aria-current={path.startsWith('/holdings') ? 'page' : undefined}>
					Všetky knihy
				</a>
				<a href={resolve('/books')}>Katalóg</a>
				<a href={resolve('/authors')}>Autori</a>
			</nav>
			<div class="hall-tools">
				<button type="button" class="hall-search-btn" onclick={openSearch} aria-label="Hľadať knihu">
					<SearchIcon class="size-4" />
					<span>Hľadať knihu</span>
				</button>
				<ThemeToggle variant="hall" />
				<a
					class="hall-login no-underline"
					href={user ? resolve('/loans') : resolve('/login')}
					aria-label={user ? 'Moje knihy' : 'Prihlásiť sa'}
				>
					<UserIcon class="size-4" />
					<span>{user ? 'Moje knihy' : 'Prihlásiť sa'}</span>
				</a>
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
				<a href={resolve('/')} onclick={closeMenu}>Fond</a>
				<a href={resolve('/discover')} onclick={closeMenu}>Objavovať</a>
				<a href={resolve('/holdings')} onclick={closeMenu}>Všetky knihy</a>
				<a href={resolve('/books')} onclick={closeMenu}>Katalóg</a>
				<a href={resolve('/departments')} onclick={closeMenu}>Odbory</a>
				<a href={resolve('/authors')} onclick={closeMenu}>Autori</a>
				{#if user}
					<a href={resolve('/loans')} onclick={closeMenu}>Moje knihy</a>
				{:else}
					<a href={resolve('/login')} onclick={closeMenu}>Prihlásiť sa</a>
				{/if}
				<div class="hall-drawer-tools">
					<ThemeToggle variant="hall" />
					<button type="button" class="hall-search-btn is-mobile" onclick={openSearch}>
						<SearchIcon class="size-4" />
						<span>Hľadať knihu</span>
					</button>
				</div>
			</nav>
		{/if}

		{@render children()}
		<Footer tone="hall" />
	</div>

	<CatalogSearch preview={searchPreview} bind:open={searchOpen} />
</div>
