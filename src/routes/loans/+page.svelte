<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import BookCover from '$lib/components/BookCover.svelte';
	import StampBurst from '$lib/components/StampBurst.svelte';
	import { authorLine, dueStatus, readerNumber, shortDate } from '$lib/format';
	import type { ActionData, PageProps } from './$types';
	import Seo from '$lib/components/Seo.svelte';

	let { data, form }: PageProps & { form: ActionData } = $props();
	let pane = $state<'aktivne' | 'historia'>('aktivne');
	const serial = $derived(readerNumber(data.reader.id));
	const slots = $derived(Array.from({ length: data.maxLoans }, (_, i) => i < data.activeCount));
</script>

<Seo
	title="Moja knižnica"
	description="Aktívne výpožičky a vrátenia v školskej knižnici SPŠT."
	index={false}
/>

{#if form && 'stamp' in form && form.stamp}
	<StampBurst label={form.stamp} sub={form.sub} />
{/if}

<article class="folio">
	<header class="folio-id">
		<span class="folio-spine" aria-hidden="true"></span>
		<div class="folio-holes" aria-hidden="true">
			<span></span><span></span><span></span>
		</div>
		<p class="folio-kicker">výpožičný lístok</p>
		<div class="folio-who">
			<h2>{data.reader.name}</h2>
			<p>preukaz {serial} · pavilón B</p>
		</div>
		<ol class="folio-slots" aria-label="{data.activeCount} z {data.maxLoans} miest">
			{#each slots as taken, i (i)}
				<li class:taken data-n={i + 1}></li>
			{/each}
		</ol>
		<p class="folio-quota">{data.activeCount} / {data.maxLoans}</p>
		<span class="folio-stamp" aria-hidden="true">SPŠT</span>
	</header>

	{#if form && 'message' in form && form.message}
		<p class="folio-note" role="alert">{form.message}</p>
	{/if}

	<div class="folio-tabs" role="tablist" aria-label="Výpožičky">
		<button
			type="button"
			role="tab"
			id="tab-aktivne"
			aria-selected={pane === 'aktivne'}
			aria-controls="panel-aktivne"
			onclick={() => (pane = 'aktivne')}
		>
			Požičané <em>{data.loans.length}</em>
		</button>
		<button
			type="button"
			role="tab"
			id="tab-historia"
			aria-selected={pane === 'historia'}
			aria-controls="panel-historia"
			onclick={() => (pane = 'historia')}
		>
			Vrátené <em>{data.history.length}</em>
		</button>
	</div>

	{#if pane === 'aktivne'}
		<div
			class="folio-pane"
			id="panel-aktivne"
			role="tabpanel"
			aria-labelledby="tab-aktivne"
		>
			{#if data.loans.length === 0}
				<div class="folio-empty">
					<div>
						<h3>Zatiaľ nič nepožičiavaš</h3>
						<p>Vyber knihu z katalógu a vypožičaj si ju na 21 dní. Na preukaze máš päť miest.</p>
					</div>
					<a class="folio-go" href={resolve('/books')}>Otvoriť katalóg</a>
					<p class="folio-empty-mark" aria-hidden="true">prázdne</p>
				</div>
			{:else}
				<ul class="folio-slips">
					{#each data.loans as item (item.id)}
						{@const due = dueStatus(item.dueAt)}
						<li class="slip" data-tone={due.tone}>
							<BookCover book={item.book} size="thumb" />
							<div class="slip-copy">
								<p class="slip-due">{due.label}</p>
								<a href={resolve('/books/[id]', { id: item.book.id })}>{item.book.title}</a>
								<p class="slip-meta">{authorLine(item.book.authors)}</p>
								<p class="slip-when">Od {shortDate(item.borrowedAt)}</p>
							</div>
							<form method="POST" action="?/return" use:enhance>
								<input type="hidden" name="loanId" value={item.id} />
								<button type="submit">Vrátiť</button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{:else}
		<div
			class="folio-pane"
			id="panel-historia"
			role="tabpanel"
			aria-labelledby="tab-historia"
		>
			{#if data.history.length === 0}
				<div class="folio-empty is-quiet">
					<div>
						<h3>Ešte žiadna vrátená kniha</h3>
						<p>Keď knihu vrátiš, ostane tu ako záznam v denníku pultu.</p>
					</div>
					<p class="folio-empty-mark" aria-hidden="true">archív</p>
				</div>
			{:else}
				<ol class="folio-ledger">
					{#each data.history as item (item.id)}
						<li>
							<a href={resolve('/books/[id]', { id: item.book.id })}>{item.book.title}</a>
							<span></span>
							<time>{item.returnedAt ? shortDate(item.returnedAt) : ''}</time>
						</li>
					{/each}
				</ol>
			{/if}
		</div>
	{/if}
</article>

<style>
	.folio {
		--ink: #2c1d16;
		--muted: #7a6554;
		--rule: #d7c4ae;
		--stamp: #c45a38;
		--ticket: #fff8ee;
		position: relative;
		max-width: 46rem;
		margin: 0 auto 2.5rem;
		animation: folio-in 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}

	:global(html.dark) .folio {
		--ink: #241710;
		--muted: #6d5848;
		--rule: #cbb79f;
		--ticket: #f4eadc;
	}

	.folio-id {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		grid-template-areas:
			'kicker kicker stamp'
			'who slots quota';
		align-items: end;
		gap: 0.35rem 1rem;
		overflow: hidden;
		min-height: 7.2rem;
		padding: 1.2rem 1.25rem 1.15rem 2.05rem;
		border: 1px solid color-mix(in srgb, var(--ink) 14%, transparent);
		border-radius: 1.15rem;
		background:
			radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--stamp) 11%, transparent), transparent 48%),
			var(--ticket);
		color: var(--ink);
		box-shadow: 0 1.4rem 2.4rem -1.4rem color-mix(in srgb, var(--ink) 38%, transparent);
	}

	.folio-id::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.2;
		mix-blend-mode: multiply;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
	}

	.folio-spine {
		position: absolute;
		top: 0.85rem;
		bottom: 0.85rem;
		left: 0;
		width: 0.38rem;
		background: linear-gradient(180deg, #c45a38, #3c2a21 62%, #c45a38);
	}

	.folio-holes {
		position: absolute;
		top: 1.15rem;
		bottom: 1.15rem;
		left: 0.68rem;
		z-index: 2;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.folio-holes span {
		display: block;
		width: 0.68rem;
		height: 0.68rem;
		border: 1px solid color-mix(in srgb, var(--ink) 18%, transparent);
		border-radius: 999px;
		background: var(--paper);
		box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.18);
	}

	.folio-kicker {
		grid-area: kicker;
		z-index: 1;
		margin: 0;
		color: var(--muted);
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	.folio-who {
		grid-area: who;
		z-index: 1;
		min-width: 0;
	}

	.folio-who h2 {
		margin: 0;
		font-family: var(--font-display, Fraunces, serif);
		font-size: clamp(1.55rem, 4.2vw, 2.15rem);
		font-weight: 650;
		line-height: 1.05;
		letter-spacing: -0.035em;
		font-variation-settings: 'SOFT' 28, 'WONK' 1;
	}

	.folio-who p {
		margin: 0.28rem 0 0;
		color: var(--muted);
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.folio-slots {
		grid-area: slots;
		z-index: 1;
		display: flex;
		gap: 0.32rem;
		margin: 0 0 0.15rem;
		padding: 0;
		list-style: none;
	}

	.folio-slots li {
		width: 0.72rem;
		height: 0.92rem;
		border: 1.5px solid color-mix(in srgb, var(--ink) 28%, transparent);
		border-radius: 2px 2px 1px 1px;
		background: color-mix(in srgb, var(--ink) 6%, transparent);
		transform: skewX(-8deg);
	}

	.folio-slots li.taken {
		border-color: color-mix(in srgb, var(--stamp) 70%, var(--ink));
		background: linear-gradient(180deg, #c45a38, #8a3a26);
		box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.22);
	}

	.folio-quota {
		grid-area: quota;
		z-index: 1;
		margin: 0 0 0.05rem;
		color: var(--muted);
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.08em;
	}

	.folio-stamp {
		grid-area: stamp;
		z-index: 1;
		justify-self: end;
		align-self: start;
		margin: 0;
		padding: 0.34rem 0.42rem 0.24rem;
		border: 2px solid color-mix(in srgb, var(--stamp) 78%, var(--ink));
		border-radius: 999px;
		color: var(--stamp);
		font-family: var(--font-display, Fraunces, serif);
		font-size: 0.7rem;
		font-style: italic;
		font-weight: 700;
		letter-spacing: 0.14em;
		line-height: 1;
		text-transform: uppercase;
		transform: rotate(9deg);
		mix-blend-mode: multiply;
		pointer-events: none;
	}

	.folio-note {
		margin: 0.9rem 0 0;
		padding: 0.7rem 0.9rem;
		border-left: 3px solid var(--stamp);
		background: color-mix(in srgb, var(--stamp) 10%, var(--ticket));
		color: #9a3b28;
		font-family: var(--font-body, Newsreader, serif);
		font-size: 1rem;
	}

	.folio-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.35rem;
		margin: 1.15rem 0 1.25rem;
		padding: 0.28rem;
		border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
		border-radius: 999px;
		background: color-mix(in srgb, var(--ink) 5%, transparent);
	}

	.folio-tabs button {
		appearance: none;
		border: 0;
		border-radius: 999px;
		padding: 0.62rem 0.4rem;
		background: transparent;
		color: var(--muted);
		cursor: pointer;
		font-family: var(--font-body, Newsreader, serif);
		font-size: 1.02rem;
		transition: background 0.2s ease, color 0.2s ease;
	}

	.folio-tabs button em {
		margin-left: 0.15rem;
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.72rem;
		font-style: normal;
		font-weight: 700;
		letter-spacing: 0.04em;
	}

	.folio-tabs button[aria-selected='true'] {
		background: var(--ticket);
		color: var(--ink);
		box-shadow: 0 6px 14px -10px color-mix(in srgb, var(--ink) 45%, transparent);
	}

	.folio-tabs button:focus-visible {
		outline: 2px solid var(--stamp);
		outline-offset: 2px;
	}

	.folio-pane {
		animation: folio-pane 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}

	.folio-empty {
		position: relative;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 1rem 1.5rem;
		overflow: hidden;
		min-height: 9.5rem;
		padding: 1.6rem 1.5rem 1.5rem;
		border: 1px dashed color-mix(in srgb, var(--ink) 22%, transparent);
		border-radius: 1.05rem;
		background:
			repeating-linear-gradient(
				-12deg,
				transparent,
				transparent 11px,
				color-mix(in srgb, var(--ink) 4%, transparent) 11px,
				color-mix(in srgb, var(--ink) 4%, transparent) 12px
			),
			var(--ticket);
	}

	.folio-empty.is-quiet {
		grid-template-columns: minmax(0, 1fr);
		min-height: 7.5rem;
	}

	.folio-empty-mark {
		position: absolute;
		right: auto;
		left: 1.15rem;
		bottom: -0.2rem;
		z-index: 0;
		margin: 0;
		color: color-mix(in srgb, var(--stamp) 42%, transparent);
		font-family: var(--font-display, Fraunces, serif);
		font-size: clamp(2.2rem, 7vw, 3.6rem);
		font-style: italic;
		font-weight: 700;
		letter-spacing: 0.08em;
		line-height: 1;
		text-transform: uppercase;
		transform: rotate(-12deg);
		pointer-events: none;
		mix-blend-mode: multiply;
	}

	.folio-empty.is-quiet .folio-empty-mark {
		left: auto;
		right: 0.8rem;
		bottom: 0.2rem;
	}

	.folio-empty h3,
	.folio-empty p {
		position: relative;
		z-index: 1;
	}

	.folio-empty h3 {
		margin: 0;
		max-width: 16ch;
		font-family: var(--font-display, Fraunces, serif);
		font-size: clamp(1.45rem, 3.5vw, 1.9rem);
		font-weight: 650;
		line-height: 1.1;
		letter-spacing: -0.03em;
	}

	.folio-empty p:not(.folio-empty-mark) {
		margin: 0.45rem 0 0;
		max-width: 28ch;
		color: var(--muted);
		font-family: var(--font-body, Newsreader, serif);
		font-size: 1.05rem;
		line-height: 1.4;
	}

	.folio-go {
		position: relative;
		z-index: 1;
		justify-self: end;
		align-self: end;
		border-radius: 999px;
		padding: 0.72rem 1.15rem;
		background: var(--ink);
		color: var(--ticket);
		font-family: var(--font-sans, 'IBM Plex Sans', sans-serif);
		font-size: 0.78rem;
		font-weight: 650;
		letter-spacing: 0.04em;
		text-decoration: none;
		white-space: nowrap;
		transition: transform 0.2s ease, background 0.2s ease;
	}

	.folio-go:hover {
		background: color-mix(in srgb, var(--stamp) 70%, var(--ink));
		transform: rotate(-2deg);
	}

	.folio-slips {
		display: grid;
		gap: 0.85rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.slip {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.95rem 1.05rem;
		padding: 0.85rem 1rem 0.85rem 0.85rem;
		border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
		border-radius: 0.95rem;
		background: var(--ticket);
		box-shadow: 0 10px 22px -16px color-mix(in srgb, var(--ink) 40%, transparent);
	}

	.slip :global(.jacket) {
		box-shadow: 0 8px 14px rgb(40 32 18 / 0.16);
	}

	.slip-copy {
		min-width: 0;
	}

	.slip-due {
		display: inline-block;
		margin: 0 0 0.35rem;
		padding: 0.18rem 0.42rem 0.12rem;
		border: 1.5px solid currentColor;
		border-radius: 999px;
		color: var(--stamp);
		font-family: var(--font-display, Fraunces, serif);
		font-size: 0.68rem;
		font-style: italic;
		font-weight: 700;
		letter-spacing: 0.08em;
		line-height: 1;
		text-transform: uppercase;
		transform: rotate(-6deg);
		mix-blend-mode: multiply;
	}

	.slip[data-tone='ok'] .slip-due {
		color: #3f6b48;
	}

	.slip[data-tone='soon'] .slip-due {
		color: #b45a1a;
	}

	.slip[data-tone='late'] .slip-due {
		color: #9a3b28;
	}

	.slip-copy a {
		display: block;
		color: inherit;
		font-family: var(--font-display, Fraunces, serif);
		font-size: 1.12rem;
		font-weight: 650;
		line-height: 1.2;
		letter-spacing: -0.025em;
		text-decoration: none;
		text-wrap: balance;
	}

	.slip-copy a:hover {
		color: var(--stamp);
	}

	.slip-meta,
	.slip-when {
		margin: 0.2rem 0 0;
		color: var(--muted);
		font-family: var(--font-body, Newsreader, serif);
		font-size: 0.95rem;
	}

	.slip-when {
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.slip form button {
		appearance: none;
		border: 0;
		border-radius: 999px;
		padding: 0.55rem 0.95rem;
		background: color-mix(in srgb, var(--stamp) 16%, var(--ticket));
		color: #9a3b28;
		cursor: pointer;
		font-family: var(--font-sans, 'IBM Plex Sans', sans-serif);
		font-size: 0.74rem;
		font-weight: 650;
		letter-spacing: 0.04em;
		transition: background 0.2s ease, transform 0.2s ease;
	}

	.slip form button:hover {
		background: #9a3b28;
		color: var(--ticket);
		transform: rotate(2deg);
	}

	.folio-ledger {
		margin: 0;
		padding: 0.2rem 0;
		list-style: none;
	}

	.folio-ledger li {
		display: grid;
		grid-template-columns: auto minmax(1.5rem, 1fr) auto;
		align-items: baseline;
		gap: 0.65rem;
		padding: 0.85rem 0.1rem;
		border-bottom: 1px dotted var(--rule);
	}

	.folio-ledger a {
		color: inherit;
		font-family: var(--font-display, Fraunces, serif);
		font-size: 1.08rem;
		font-weight: 600;
		text-decoration: none;
	}

	.folio-ledger a:hover {
		color: var(--stamp);
	}

	.folio-ledger span {
		border-bottom: 1px dotted var(--rule);
		transform: translateY(-0.2rem);
	}

	.folio-ledger time {
		color: var(--muted);
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	@keyframes folio-in {
		from {
			opacity: 0;
			transform: translateY(0.7rem);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes folio-pane {
		from {
			opacity: 0;
			transform: translateY(0.35rem);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (max-width: 640px) {
		.folio-id {
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-areas:
				'kicker stamp'
				'who who'
				'slots quota';
		}

		.folio-empty {
			grid-template-columns: 1fr;
		}

		.folio-go {
			justify-self: start;
		}

		.folio-empty-mark {
			opacity: 0.35;
		}

		.slip {
			grid-template-columns: auto minmax(0, 1fr);
		}

		.slip form {
			grid-column: 1 / -1;
		}

		.slip form button {
			width: 100%;
		}
	}
</style>
