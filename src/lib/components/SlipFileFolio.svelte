<script lang="ts">
	import { parseCsv } from '$lib/csv';
	import { tokenizeXml } from '$lib/xml';
	import { toast } from 'svelte-sonner';

	let {
		title,
		csv,
		xml,
		csvHref,
		xmlHref
	}: {
		title: string;
		csv: string;
		xml: string;
		csvHref: string;
		xmlHref: string;
	} = $props();

	let pane = $state<'csv' | 'xml'>('csv');
	const sheet = $derived(parseCsv(csv));
	const lines = $derived(tokenizeXml(xml));
	const source = $derived(pane === 'csv' ? csv.replace(/^\uFEFF/, '') : xml);

	async function copy() {
		try {
			await navigator.clipboard.writeText(source);
			toast.success('Skopírované.');
		} catch {
			toast.error('Do schránky sa to nedostalo.');
		}
	}
</script>

<div class="slip-file">
	<div class="slip-file-bar">
		<p class="slip-file-kicker">{title}</p>
		<div class="slip-file-tabs" role="tablist" aria-label="Formát výkazu">
			<button type="button" role="tab" aria-selected={pane === 'csv'} onclick={() => (pane = 'csv')}>
				CSV
			</button>
			<button type="button" role="tab" aria-selected={pane === 'xml'} onclick={() => (pane = 'xml')}>
				XML
			</button>
		</div>
		<div class="slip-file-acts">
			<button type="button" onclick={copy}>Skopírovať</button>
			<a href={pane === 'csv' ? csvHref : xmlHref}>Stiahnuť {pane === 'csv' ? 'CSV' : 'XML'}</a>
		</div>
	</div>

	{#if pane === 'csv'}
		<div class="slip-csv" role="region" aria-label="CSV {title}">
			<table>
				<thead>
					<tr>
						<th class="slip-n">#</th>
						{#each sheet.headers as head, i (head + i)}
							<th>{head}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#if sheet.rows.length === 0}
						<tr>
							<td class="slip-n">—</td>
							<td colspan={Math.max(sheet.headers.length, 1)}>Prázdny list.</td>
						</tr>
					{:else}
						{#each sheet.rows as row, i (i)}
							<tr>
								<td class="slip-n">{String(i + 1).padStart(2, '0')}</td>
								{#each sheet.headers as _, c (c)}
									<td>{row[c] ?? ''}</td>
								{/each}
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="slip-xml" role="region" aria-label="XML {title}">
			<ol>
				{#each lines as line (line.n)}
					<li>
						<span class="slip-xml-n">{line.n}</span>
						<code>
							{#each line.tokens as token, i (`${line.n}-${i}`)}
								<span data-k={token.kind}>{token.value}</span>
							{/each}
						</code>
					</li>
				{/each}
			</ol>
		</div>
	{/if}
</div>

<style>
	.slip-file {
		--file-paper: #f4ead6;
		--file-rule: #d7c4ae;
		--file-ink: #2a1c14;
		--file-brass: #c45a38;
		--file-lamp: #c9a15a;
		position: relative;
		overflow: hidden;
		margin-top: 1.05rem;
		border: 1px solid color-mix(in srgb, var(--pult-walnut, #3a271c) 16%, transparent);
		border-radius: 0.95rem;
		background: var(--file-paper);
		box-shadow: 0 1.1rem 2rem -1.4rem color-mix(in srgb, var(--pult-ink, #2a1c14) 40%, transparent);
	}

	.slip-file::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.18;
		mix-blend-mode: multiply;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E");
	}

	.slip-file-bar,
	.slip-csv,
	.slip-xml {
		position: relative;
		z-index: 1;
	}

	.slip-file-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.55rem 0.85rem;
		padding: 0.7rem 0.85rem;
		border-bottom: 1px dashed color-mix(in srgb, var(--pult-walnut, #3a271c) 18%, transparent);
		background: color-mix(in srgb, var(--pult-walnut, #3a271c) 5%, transparent);
	}

	.slip-file-kicker {
		margin: 0;
		margin-right: auto;
		color: var(--pult-muted, #6e5c4e);
		font-family: 'IBM Plex Mono', monospace;
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.slip-file-tabs {
		display: flex;
		padding: 0.18rem;
		border: 1px solid color-mix(in srgb, var(--pult-walnut, #3a271c) 16%, transparent);
		border-radius: 999px;
		background: color-mix(in srgb, var(--pult-ink, #2a1c14) 4%, transparent);
	}

	.slip-file-tabs button,
	.slip-file-acts :is(button, a) {
		appearance: none;
		display: inline-grid;
		place-items: center;
		height: 2rem;
		padding: 0 0.8rem;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: var(--pult-muted, #6e5c4e);
		cursor: pointer;
		font-family: 'Fraunces', serif;
		font-size: 0.78rem;
		font-style: italic;
		font-weight: 700;
		text-decoration: none;
	}

	.slip-file-tabs button[aria-selected='true'] {
		background: var(--pult-walnut, #3a271c);
		color: var(--pult-paper, #f3ead8);
	}

	.slip-file-acts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.slip-file-acts :is(button, a) {
		border: 1px solid color-mix(in srgb, var(--pult-walnut, #3a271c) 18%, transparent);
		color: var(--pult-ink, #2a1c14);
	}

	.slip-file-acts :is(button, a):hover {
		background: var(--pult-walnut, #3a271c);
		color: var(--pult-paper, #f3ead8);
	}

	.slip-csv {
		overflow: auto;
		max-height: 28rem;
		padding: 0 0 0.4rem;
		background:
			repeating-linear-gradient(
				180deg,
				transparent 0,
				transparent 1.7rem,
				color-mix(in srgb, #3f6b48 9%, transparent) 1.7rem,
				color-mix(in srgb, #3f6b48 9%, transparent) 1.71rem
			);
	}

	.slip-csv table {
		width: max-content;
		min-width: 100%;
		border-collapse: collapse;
		font-size: 0.88rem;
	}

	.slip-csv th,
	.slip-csv td {
		padding: 0.38rem 0.7rem 0.32rem;
		text-align: left;
		white-space: nowrap;
		vertical-align: baseline;
	}

	.slip-csv th {
		position: sticky;
		top: 0;
		z-index: 1;
		border-bottom: 1px solid color-mix(in srgb, var(--file-brass) 45%, transparent);
		background: color-mix(in srgb, var(--file-paper) 88%, #fff);
		color: var(--file-brass);
		font-family: 'IBM Plex Mono', monospace;
		font-size: 0.58rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.slip-csv td {
		color: var(--file-ink);
		font-family: 'Newsreader', serif;
	}

	.slip-n {
		width: 2.4rem;
		color: var(--pult-muted, #6e5c4e) !important;
		font-family: 'IBM Plex Mono', monospace !important;
		font-size: 0.62rem !important;
		font-weight: 600;
		letter-spacing: 0.06em;
	}

	.slip-xml {
		overflow: auto;
		max-height: 28rem;
		padding: 0.55rem 0.7rem 0.85rem 0;
		background:
			linear-gradient(90deg, #241610 0, #241610 3.15rem, transparent 3.15rem),
			var(--file-paper);
	}

	.slip-xml ol {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.slip-xml li {
		display: grid;
		grid-template-columns: 3.15rem minmax(0, 1fr);
		align-items: baseline;
		min-height: 1.45rem;
		font-size: 0.82rem;
		line-height: 1.45rem;
	}

	.slip-xml-n {
		padding-right: 0.55rem;
		color: #c9a15a;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 0.58rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-align: right;
	}

	.slip-xml code {
		overflow-wrap: anywhere;
		white-space: pre-wrap;
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: 0.78rem;
	}

	.slip-xml [data-k='indent'] {
		color: color-mix(in srgb, var(--file-rule) 70%, transparent);
	}

	.slip-xml [data-k='decl'] {
		color: var(--file-lamp);
		font-style: italic;
	}

	.slip-xml [data-k='punct'] {
		color: color-mix(in srgb, var(--file-ink) 45%, transparent);
	}

	.slip-xml [data-k='name'] {
		color: var(--file-brass);
		font-weight: 700;
	}

	.slip-xml [data-k='attr'] {
		color: #3f6b48;
	}

	.slip-xml [data-k='string'] {
		color: #8a5a18;
	}

	.slip-xml [data-k='text'] {
		color: var(--file-ink);
		font-family: 'Fraunces', serif;
		font-size: 0.92rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}

	@media (prefers-reduced-motion: reduce) {
		.slip-file {
			box-shadow: none;
		}
	}
</style>
