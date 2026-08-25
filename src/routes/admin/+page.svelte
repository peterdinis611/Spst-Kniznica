<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const out = $derived(data.counts.openLoans);
	const outWord = $derived(out === 1 ? 'kniha' : out >= 2 && out <= 4 ? 'knihy' : 'kníh');

	const cards = $derived([
		{ href: '/admin/books', n: data.counts.books, label: 'kníh', code: '04' },
		{ href: '/admin/departments', n: data.counts.categories, label: 'odborov', code: '02' },
		{ href: '/admin/authors', n: data.counts.authors, label: 'autorov', code: '03' },
		{ href: '/admin/book-authors', n: data.counts.links, label: 'väzieb', code: '05' },
		{ href: '/admin/holdings', n: data.counts.holdings, label: 'výtlačkov', code: '06' },
		{ href: '/admin/loans', n: data.counts.loans, label: 'lístkov', code: '07' },
		{ href: '/admin/reservations', n: data.counts.reservations, label: 'rezervácií', code: '08' },
		{ href: '/admin/readers', n: data.counts.readers, label: 'preukazov', code: '09' }
	]);
</script>

<Seo title="Pult" description="Správa školského fondu SPŠT — kartotéka tabuliek." index={false} />

<a class="pult-blot" class:is-clear={out === 0} href="/admin/loans">
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
