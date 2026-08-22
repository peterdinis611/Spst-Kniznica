<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import './layout.css';
	import './landing.css';
	import favicon from '$lib/assets/favicon.svg';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import AppTopbar from '$lib/components/AppTopbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ScrollToTop from '$lib/components/ScrollToTop.svelte';

	let { children, data } = $props();
	const isHall = $derived(page.route.id === '/');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="application-name" content="SPŠT knižnica" />
	<meta name="apple-mobile-web-app-title" content="SPŠT knižnica" />
	<meta name="format-detection" content="telephone=no" />
</svelte:head>

<ModeWatcher
	defaultMode="system"
	themeColors={{ light: '#efe4cc', dark: '#161410' }}
/>
<Toaster />

<a class="skip-link" href="#obsah">Preskočiť na obsah</a>
<form id="logout-form" method="POST" action={resolve('/odhlasenie')} class="hidden"></form>

{#if isHall}
	<main id="obsah" class="landing-shell">{@render children()}</main>
{:else}
	<div class="desk">
		<div class="hidden h-dvh lg:sticky lg:top-0 lg:block">
			<AppSidebar user={data.user} />
		</div>
		<div class="desk-shell">
			<div class="desk-panel">
				<AppTopbar user={data.user} categories={data.categories} />
				<main id="obsah" class="desk-main pt-7">{@render children()}</main>
				<div class="desk-main pt-0">
					<Footer tone="desk" />
				</div>
			</div>
		</div>
	</div>
{/if}

<ScrollToTop />
