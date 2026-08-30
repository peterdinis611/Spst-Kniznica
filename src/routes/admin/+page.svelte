<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const out = $derived(data.counts.openLoans);
	const outWord = $derived(out === 1 ? 'kniha' : out >= 2 && out <= 4 ? 'knihy' : 'kníh');
	const queue = $derived(data.queue);
	const hasQueue = $derived(
		queue.overdue.length + queue.pickup.length + queue.waiting.length + queue.passes.length > 0
	);

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

	const rails = $derived(
		[
			{ key: 'overdue', kicker: '01 po lehote', href: '/admin/loans', rows: queue.overdue },
			{ key: 'pickup', kicker: '02 na pulte', href: '/admin/reservations', rows: queue.pickup },
			{ key: 'waiting', kicker: '03 čakajú', href: '/admin/reservations', rows: queue.waiting },
			{ key: 'passes', kicker: '04 nové preukazy', href: '/admin/readers', rows: queue.passes }
		].filter((rail) => rail.rows.length > 0)
	);
</script>

<Seo title="Pult" description="Správa školského fondu SPŠT — kartotéka tabuliek." index={false} />

<div class="pult-today">
	<a class="pult-blot" class:is-clear={out === 0} href="/admin/loans">
		<em>vonku z fondu</em>
		<strong>{out.toLocaleString('sk-SK')}</strong>
		<span>{out === 0 ? 'žiadny zväzok na lístku' : `${outWord} na čitateľoch`}</span>
	</a>

	{#if hasQueue}
		<div class="pult-queue">
			<p class="pult-queue-kicker">dnešný rad</p>
			{#each rails as rail, i (rail.key)}
				<section class="pult-rail" style="animation-delay: {80 + i * 70}ms">
					<a class="pult-rail-head" href={rail.href}>{rail.kicker}</a>
					<ul>
						{#each rail.rows as row (row.id)}
							<li>
								<a href={row.href}>
									<em>{row.stamp}</em>
									<strong>{row.title}</strong>
									<span>{row.detail}</span>
								</a>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
	{:else}
		<p class="pult-queue-empty">Rad je prázdny. Fond dýcha.</p>
	{/if}
</div>

<div class="pult-stats">
	{#each cards as card, i (card.href)}
		<a class="pult-stat" href={card.href} style="animation-delay: {i * 55}ms">
			<em>{card.code}</em>
			<b>{card.n.toLocaleString('sk-SK')}</b>
			<span>{card.label}</span>
		</a>
	{/each}
</div>
