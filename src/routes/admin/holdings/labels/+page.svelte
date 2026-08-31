<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { spineLines } from '$lib/spine';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo
	title="Štítky · Pult"
	description="Signatúra a inventár na chrbát — tlač z pultu, nie výkaz."
	index={false}
/>

<div class="spine-folio">
	<header class="spine-acts">
		<p class="pult-folio-kicker">pavilón B · chrbtice</p>
		<h2>Štítky na chrbát.</h2>
		<p class="pult-folio-lede">
			{data.rows.length.toLocaleString('sk-SK')} lístkov. Signatúra ide hore, inventár dole. Tlač
			striháš na knihu — nie do výkazu.
		</p>
		<div class="pult-folio-acts">
			<button type="button" onclick={() => window.print()}>Tlačiť štítky</button>
			<a href={data.q ? `/admin/holdings?q=${encodeURIComponent(data.q)}` : '/admin/holdings'}
				>späť k výtlačkom</a
			>
		</div>
	</header>

	{#if data.rows.length === 0}
		<p class="pult-folio-empty">V zásuvke nie je výtlačok na štítok.</p>
	{:else}
		<ul class="spine-sheet">
			{#each data.rows as row (row.id)}
				<li class="spine-ticket">
					<em>SPŠT · {row.categoryCode}</em>
					<strong>
						{#each spineLines(row.callNumber) as line, i (`${row.id}-${i}`)}
							<span>{line}</span>
						{/each}
					</strong>
					<b>{row.inventoryNo}</b>
					<small>{row.title}</small>
				</li>
			{/each}
		</ul>
	{/if}
</div>
