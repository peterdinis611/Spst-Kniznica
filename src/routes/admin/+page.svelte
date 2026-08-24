<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const cards = $derived([
		{ href: '/admin/odbory', n: data.counts.categories, label: 'odborov' },
		{ href: '/admin/autori', n: data.counts.authors, label: 'autorov' },
		{ href: '/admin/knihy', n: data.counts.books, label: 'kníh' },
		{ href: '/admin/vazby', n: data.counts.links, label: 'väzieb' },
		{ href: '/admin/vytlacky', n: data.counts.holdings, label: 'výtlačkov' },
		{ href: '/admin/vypozicky', n: data.counts.loans, label: 'lístkov' },
		{ href: '/admin/rezervacie', n: data.counts.reservations, label: 'rezervácií' },
		{ href: '/admin/citately', n: data.counts.readers, label: 'preukazov' }
	]);
</script>

<Seo title="Pult" description="Správa školského fondu SPŠT — kartotéka tabuliek." index={false} />

<p class="pult-count" style="margin-bottom: 1rem">
	vonku {data.counts.openLoans}
	{data.counts.openLoans === 1 ? 'kniha' : data.counts.openLoans >= 2 && data.counts.openLoans <= 4 ? 'knihy' : 'kníh'}
</p>

<div class="pult-stats">
	{#each cards as card (card.href)}
		<a class="pult-stat" href={card.href}>
			<b>{card.n.toLocaleString('sk-SK')}</b>
			<span>{card.label}</span>
		</a>
	{/each}
</div>
