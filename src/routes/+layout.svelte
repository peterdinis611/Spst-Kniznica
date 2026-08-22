<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

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

<div class="site-shell">
	<Header user={data.user} />
	<main id="obsah" class="relative z-10 flex-1 pb-16">{@render children()}</main>
	<Footer />
</div>
