<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const out = $derived(data.counts.openLoans);
	const outWord = $derived(out === 1 ? 'kniha' : out >= 2 && out <= 4 ? 'knihy' : 'kníh');

	const cards = $derived([
		{ href: '/admin/knihy', n: data.counts.books, label: 'kníh', code: '04' },
		{ href: '/admin/odbory', n: data.counts.categories, label: 'odborov', code: '02' },
		{ href: '/admin/autori', n: data.counts.authors, label: 'autorov', code: '03' },
		{ href: '/admin/vazby', n: data.counts.links, label: 'väzieb', code: '05' },
		{ href: '/admin/vytlacky', n: data.counts.holdings, label: 'výtlačkov', code: '06' },
		{ href: '/admin/vypozicky', n: data.counts.loans, label: 'lístkov', code: '07' },
		{ href: '/admin/rezervacie', n: data.counts.reservations, label: 'rezervácií', code: '08' },
		{ href: '/admin/citately', n: data.counts.readers, label: 'preukazov', code: '09' }
	]);
</script>

<Seo title="Pult" description="Správa školského fondu SPŠT — kartotéka tabuliek." index={false} />

<a class="pult-blot" class:is-clear={out === 0} href="/admin/vypozicky">
	<em>vonku z fondu</em>
	<strong>{out.toLocaleString('sk-SK')}</strong>
	<span>{out === 0 ? 'žiadny zväzok na lístku' : `${outWord} na čitateľoch`}</span>
</a>

<div class="pult-stats">
	{#each cards as card, i (card.href)}
		<a class="pult-stat" href={card.href} style="animation-delay: {i * 55}ms">
			<em>{card.code}</em>
			<b>{card.n.toLocaleString('sk-SK')}</b>
			<span>{card.label}</span>
		</a>
	{/each}
</div>
