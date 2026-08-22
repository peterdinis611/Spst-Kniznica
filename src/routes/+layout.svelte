<script lang="ts">
	import { resolve } from '$app/paths';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import AppTopbar from '$lib/components/AppTopbar.svelte';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>SPŠT Knižnica</title>
	<meta
		name="description"
		content="Školská knižnica SPŠT — katalóg, autori, odbory, výpožičky a vrátenia."
	/>
</svelte:head>

<ModeWatcher defaultMode="light" />
<Toaster />

<a class="skip-link" href="#obsah">Preskočiť na obsah</a>
<form id="logout-form" method="POST" action={resolve('/odhlasenie')} class="hidden"></form>

<div class="desk">
	<div class="hidden h-dvh lg:sticky lg:top-0 lg:block">
		<AppSidebar user={data.user} />
	</div>
	<div class="desk-stage">
		<AppTopbar user={data.user} categories={data.categories} loanCount={data.loanCount} />
		<main id="obsah" class="desk-main pt-8">{@render children()}</main>
	</div>
</div>
