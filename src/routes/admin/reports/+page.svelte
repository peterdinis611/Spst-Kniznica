<script lang="ts">
	import { holdingLabel } from '$lib/admin';
	import { INVENTORY_SIGHT_LABEL, type InventorySight } from '$lib/inventory-sight';
	import SlipFileFolio from '$lib/components/SlipFileFolio.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { inventoryCsv, inventoryXml, overdueCsv, overdueXml } from '$lib/desk-export';
	import { daysLabel, stampDate } from '$lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const out = $derived(data.inventory.filter((row) => row.status === 'loaned').length);
	const missing = $derived(data.inventory.filter((row) => row.sight === 'missing').length);
	const late = $derived(data.overdue.length);
	const peciatka = $derived(stampDate(new Date()));
	const inventorySheet = $derived(inventoryCsv(data.inventory));
	const overdueSheet = $derived(overdueCsv(data.overdue));
	const inventoryDoc = $derived(inventoryXml(data.inventory, peciatka));
	const overdueDoc = $derived(overdueXml(data.overdue, peciatka));
</script>

<Seo
	title="Výkazy · Pult"
	description="Inventúra fondu a oneskorené lístky — na tlač, CSV a XML, raz za polrok."
	index={false}
/>

<div class="pult-folio">
	<header class="pult-folio-mast">
		<p class="pult-folio-kicker">pavilón B · stav k {data.stamp}</p>
		<h2>Stav fondu.</h2>
		<p class="pult-folio-lede">
			Dva listy pre polrok: inventúra výtlačkov a lístky po lehote. Tlač ide do PDF. CSV a XML
			otvoríš na pulte, alebo stiahneš.
		</p>
		<em class="pult-folio-seal" aria-hidden="true">SPŠT</em>
		<div class="pult-folio-acts">
			<button type="button" onclick={() => window.print()}>Tlačiť list</button>
			<a href="/admin/reports/inventory.csv">CSV inventúra</a>
			<a href="/admin/reports/inventory.xml">XML inventúra</a>
			<a href="/admin/reports/overdue.csv">CSV po lehote</a>
			<a href="/admin/reports/overdue.xml">XML po lehote</a>
		</div>
	</header>

	<section class="pult-folio-sheet" aria-labelledby="folio-inv">
		<p class="pult-folio-index">01</p>
		<div>
			<h3 id="folio-inv">Inventúra</h3>
			<p>
				{data.inventory.length.toLocaleString('sk-SK')} výtlačkov · {out.toLocaleString('sk-SK')} vonku
				{#if missing}
					· {missing.toLocaleString('sk-SK')} chýba na chôdzi
				{/if}
			</p>
		</div>
		{#if data.inventory.length === 0}
			<p class="pult-folio-empty">Fond je prázdny.</p>
		{:else}
			<table class="pult-table">
				<thead>
					<tr>
						<th>Inventár</th>
						<th>Stav</th>
						<th>Nález</th>
						<th>Signatúra</th>
						<th>Zväzok</th>
						<th>Odbor</th>
					</tr>
				</thead>
				<tbody>
					{#each data.inventory as row (row.inventoryNo)}
						<tr>
							<td><strong>{row.inventoryNo}</strong></td>
							<td>{holdingLabel(row.status)}</td>
							<td>{INVENTORY_SIGHT_LABEL[row.sight as InventorySight] ?? row.sight}</td>
							<td><em>{row.callNumber}</em></td>
							<td>
								<strong>{row.title}</strong>
								<em>{row.isbn} · {row.year}</em>
							</td>
							<td>{row.categoryCode}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
		<SlipFileFolio
			title="Inventúra · súbor"
			csv={inventorySheet}
			xml={inventoryDoc}
			csvHref="/admin/reports/inventory.csv"
			xmlHref="/admin/reports/inventory.xml"
		/>
	</section>

	<section class="pult-folio-sheet" aria-labelledby="folio-late">
		<p class="pult-folio-index">02</p>
		<div>
			<h3 id="folio-late">Po lehote</h3>
			<p>
				{late === 0
					? 'Žiadny otvorený lístok po termíne.'
					: `${late.toLocaleString('sk-SK')} lístkov na vrátenie.`}
			</p>
		</div>
		{#if late === 0}
			<p class="pult-folio-empty">Rad je čistý.</p>
		{:else}
			<table class="pult-table">
				<thead>
					<tr>
						<th>Trieda</th>
						<th>Čitateľ</th>
						<th>Zväzok</th>
						<th>Termín</th>
						<th>Meškanie</th>
					</tr>
				</thead>
				<tbody>
					{#each data.overdue as row (row.id)}
						<tr>
							<td><strong>{row.klass || '—'}</strong></td>
							<td>{row.firstName} {row.lastName}</td>
							<td>
								<strong>{row.title}</strong>
								<em>{row.callNumber}</em>
							</td>
							<td>{stampDate(row.dueAt)}</td>
							<td>{daysLabel(row.lateDays)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
		<SlipFileFolio
			title="Po lehote · súbor"
			csv={overdueSheet}
			xml={overdueDoc}
			csvHref="/admin/reports/overdue.csv"
			xmlHref="/admin/reports/overdue.xml"
		/>
	</section>
</div>
