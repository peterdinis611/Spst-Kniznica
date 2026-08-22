<script lang="ts">
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';

	let {
		title,
		description,
		index = true,
		type = 'website',
		image,
		jsonLd
	}: {
		title: string;
		description: string;
		index?: boolean;
		type?: 'website' | 'article' | 'book';
		image?: string;
		jsonLd?: Record<string, unknown> | Record<string, unknown>[];
	} = $props();

	const site = 'SPŠT knižnica';
	const fullTitle = $derived(title === site ? `${site} — školský fond učebníc a literatúry` : `${title} · ${site}`);
	const canonical = $derived(`${page.url.origin}${page.url.pathname}`);
	const ogImage = $derived(image ?? `${page.url.origin}${favicon}`);
	const robots = $derived(index ? 'index, follow' : 'noindex, nofollow');
	const json = $derived(jsonLd ? JSON.stringify(jsonLd) : '');
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<meta name="robots" content={robots} />
	<meta name="author" content="SPŠT knižnica" />
	<link rel="canonical" href={canonical} />
	<link rel="alternate" hreflang="sk" href={canonical} />

	<meta property="og:site_name" content={site} />
	<meta property="og:locale" content="sk_SK" />
	<meta property="og:type" content={type} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={ogImage} />

	<meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />

	{#if json}
		{@html `<script type="application/ld+json">${json}</script>`}
	{/if}
</svelte:head>
