<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { deskClassFilterSchema } from '$lib/desk-fields';
	import { firstSchemaIssue } from '$lib/form-kit';
	import { toast } from 'svelte-sonner';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const out = $derived(data.manage ? (data.counts?.openLoans ?? 0) : data.open);
	const outWord = $derived(out === 1 ? 'kniha' : out >= 2 && out <= 4 ? 'knihy' : 'kníh');
	const queue = $derived(data.queue);
	const hasQueue = $derived(
		queue.overdue.length +
			queue.inbound.length +
			queue.pickup.length +
			queue.waiting.length +
			queue.passes.length >
			0
	);

	const cards = $derived(
		data.counts
			? [
					{ href: '/admin/books', n: data.counts.books, label: 'kníh', code: '04' },
					{ href: '/admin/departments', n: data.counts.categories, label: 'odborov', code: '02' },
					{ href: '/admin/authors', n: data.counts.authors, label: 'autorov', code: '03' },
					{ href: '/admin/book-authors', n: data.counts.links, label: 'väzieb', code: '05' },
					{ href: '/admin/holdings', n: data.counts.holdings, label: 'výtlačkov', code: '06' },
					{ href: '/admin/loans', n: data.counts.loans, label: 'lístkov', code: '07' },
					{ href: '/admin/reservations', n: data.counts.reservations, label: 'rezervácií', code: '08' },
					{ href: '/admin/readers', n: data.counts.readers, label: 'preukazov', code: '09' }
				]
			: []
	);

	const rails = $derived(
		[
			{
				key: 'overdue',
				kicker: '01 po lehote',
				href: data.klass ? `/admin/loans?class=${encodeURIComponent(data.klass)}&open=1` : '/admin/loans',
				rows: queue.overdue
			},
			{
				key: 'inbound',
				kicker: '02 cestou',
				href: data.klass ? `/admin/loans?class=${encodeURIComponent(data.klass)}&open=1` : '/admin/loans',
				rows: queue.inbound
			},
			{ key: 'pickup', kicker: '03 na pulte', href: '/admin/reservations', rows: queue.pickup },
			{ key: 'waiting', kicker: '04 čakajú', href: '/admin/reservations', rows: queue.waiting },
			{ key: 'passes', kicker: '05 nové preukazy', href: '/admin/readers', rows: queue.passes }
		].filter((rail) => rail.rows.length > 0)
	);

	function checkClass(event: SubmitEvent) {
		const box = event.currentTarget as HTMLFormElement;
		const className = String(new FormData(box).get('class') ?? '');
		const issue = firstSchemaIssue(deskClassFilterSchema, { className });
		if (issue || !className.trim()) {
			event.preventDefault();
			toast.error(issue || 'Doplň triedu.');
		}
	}
</script>

<Seo
	title="Pult"
	description={data.manage
		? 'Správa školského fondu SPŠT — kartotéka tabuliek.'
		: 'Trieda vonku a oneskorené lístky.'}
	index={false}
/>

<div class="pult-today">
	{#if data.manage}
		<form class="pult-scan-strip" method="GET" action="/admin/scan">
			<p class="pult-scan-kicker">00 čítačka</p>
			<label>
				<span>Inventár alebo ISBN</span>
				<input name="code" type="text" autocomplete="off" spellcheck="false" placeholder="INF-ALGO-01" />
			</label>
			<button type="submit">Nájsť</button>
		</form>
	{:else}
		<form class="pult-class" method="GET" novalidate onsubmit={checkClass}>
			<label>
				<span>Trieda</span>
				<input
					name="class"
					type="text"
					list="desk-classes"
					value={data.klass}
					placeholder="II.A"
					autocomplete="off"
					aria-label="Trieda"
				/>
				<datalist id="desk-classes">
					{#each data.classes as item (item)}
						<option value={item}></option>
					{/each}
				</datalist>
			</label>
			<button type="submit">Čo je vonku</button>
			{#if data.klass}
				<a href="/admin">zrušiť</a>
			{/if}
		</form>
	{/if}

	<a
		class="pult-blot"
		class:is-clear={out === 0}
		href={data.klass ? `/admin/loans?class=${encodeURIComponent(data.klass)}&open=1` : '/admin/loans'}
	>
		<em>{data.klass ? `${data.klass} vonku` : 'vonku z fondu'}</em>
		<strong>{out.toLocaleString('sk-SK')}</strong>
		<span>
			{#if !data.manage && !data.klass}
				zadaj triedu — II.A, 3.INF
			{:else if out === 0}
				žiadny zväzok na lístku
			{:else}
				{outWord} na čitateľoch
			{/if}
		</span>
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
		<p class="pult-queue-empty">
			{#if !data.manage && !data.klass}
				Bez triedy rad neotvorím.
			{:else}
				Rad je prázdny. Fond dýcha.
			{/if}
		</p>
	{/if}
</div>

{#if cards.length}
	<div class="pult-stats">
		{#each cards as card, i (card.href)}
			<a class="pult-stat" href={card.href} style="animation-delay: {i * 55}ms">
				<em>{card.code}</em>
				<b>{card.n.toLocaleString('sk-SK')}</b>
				<span>{card.label}</span>
			</a>
		{/each}
	</div>
{/if}
