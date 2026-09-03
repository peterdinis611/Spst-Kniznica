<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { applyToast } from '$lib/form-kit';
	import BookCover from '$lib/components/BookCover.svelte';
	import StampBurst from '$lib/components/StampBurst.svelte';
	import { authorLine, daysLabel, dueStatus, firstName, loanedLabel, readerNumber, shortDate } from '$lib/format';
	import type { ActionData, PageProps } from './$types';
	import Seo from '$lib/components/Seo.svelte';

	let { data, form }: PageProps & { form: ActionData } = $props();
	let pane = $state<'aktivne' | 'historia' | 'rada'>('aktivne');
	const serial = $derived(readerNumber(data.reader.id));
	const shownSlots = $derived(Math.min(data.activeCount, 8));
	const slots = $derived(Array.from({ length: shownSlots }, () => true));
	const given = $derived(firstName(data.reader.name));
</script>

<Seo
	title="Moja knižnica"
	description="Aktívne výpožičky a vrátenia v školskej knižnici SPŠT."
	index={false}
/>

{#if form && 'stamp' in form && form.stamp}
	<StampBurst label={form.stamp} sub={form.sub} />
{/if}

<section class="folio">
	<div class="folio-copy">
		<p class="folio-kicker">pavilón B · lehota na lístku</p>
		<p class="folio-display">Koľko treba.</p>
		<p class="folio-lede">
			{given}, pri výpožičke vyplníš meno, triedu a dobu. Ber si toľko zväzkov, koľko potrebuješ — strop na preukaze nie je.
		</p>
		<ul class="folio-facts">
			<li>7–21 dní</li>
			<li>bez stropu</li>
			<li>pav. B</li>
		</ul>
	</div>

	<article class="folio-card">
		<span class="folio-spine" aria-hidden="true"></span>
		<div class="folio-holes" aria-hidden="true">
			<span></span><span></span><span></span><span></span>
		</div>

		<header class="folio-id">
			<p class="folio-mark">výpožičný lístok</p>
			<span class="folio-stamp" aria-hidden="true">SPŠT</span>
			<div class="folio-who">
				<h2>{data.reader.name}</h2>
				<p>preukaz {serial} · pavilón B</p>
			</div>
			<div class="folio-shelf">
				<ol class="folio-slots" aria-label={loanedLabel(data.activeCount)}>
					{#if data.activeCount === 0}
						<li data-n="+"></li>
					{:else}
						{#each slots as _, i (i)}
							<li class="taken" data-n={i + 1}></li>
						{/each}
					{/if}
				</ol>
				<p class="folio-quota">{loanedLabel(data.activeCount)}</p>
			</div>
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
				id="tab-rada"
				aria-selected={pane === 'rada'}
				aria-controls="panel-rada"
				onclick={() => (pane = 'rada')}
			>
				Čakacie <em>{data.waits.length}</em>
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

		<div class="folio-perf" aria-hidden="true"></div>

		{#if pane === 'aktivne'}
			<div class="folio-pane" id="panel-aktivne" role="tabpanel" aria-labelledby="tab-aktivne">
				{#if data.loans.length === 0}
					<div class="folio-empty">
						<div class="folio-ghosts" aria-hidden="true">
							<span style="--n: 0"></span>
							<span style="--n: 1"></span>
							<span style="--n: 2"></span>
						</div>
						<div class="folio-empty-copy">
							<h3>Zatiaľ nič nepožičiavaš</h3>
							<p>Vyber knihu z katalógu a na lístku vyplň meno, triedu a dobu. Ďalšiu môžeš vziať hneď, kým je voľný výtlačok.</p>
						</div>
						<a class="folio-go" href={resolve('/books')}>Otvoriť katalóg</a>
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
									<p class="slip-when">
										{item.borrowerClass ? `${item.borrowerClass} · ` : ''}{daysLabel(item.loanDays)} · od {shortDate(item.borrowedAt)}
									</p>
								</div>
								<div class="slip-acts">
									{#if item.returnOfferedAt}
										<p class="slip-wait">Cestou na pult</p>
									{:else}
										{#if item.canRenew}
											<form method="POST" action="?/renew" use:enhance={applyToast()}>
												<input type="hidden" name="loanId" value={item.id} />
												<button type="submit" class="is-renew">Predĺžiť</button>
											</form>
										{/if}
										<form method="POST" action="?/return" use:enhance={applyToast()}>
											<input type="hidden" name="loanId" value={item.id} />
											<button type="submit">Na pult</button>
										</form>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{:else if pane === 'rada'}
			<div class="folio-pane" id="panel-rada" role="tabpanel" aria-labelledby="tab-rada">
				{#if data.waits.length === 0}
					<div class="folio-empty is-quiet">
						<div class="folio-empty-copy">
							<h3>Žiadny čakací lístok</h3>
							<p>Keď je nula voľných, na karte knihy položíš lístok. Ozveme sa, keď pult naskenuje vrátenie.</p>
						</div>
					</div>
				{:else}
					<ul class="folio-slips">
						{#each data.waits as item (item.id)}
							<li class="slip" data-tone={item.status === 'fulfilled' ? 'soon' : 'ok'}>
								<BookCover book={item.book} size="thumb" />
								<div class="slip-copy">
									<p class="slip-due">
										{item.status === 'fulfilled'
											? `Na pulte do ${shortDate(item.expiresAt)}`
											: `${item.place}. v rade`}
									</p>
									<a href={resolve('/books/[id]', { id: item.book.id })}>{item.book.title}</a>
									<p class="slip-meta">{item.book.callNumber}</p>
								</div>
								<form method="POST" action="?/cancelWait" use:enhance={applyToast()}>
									<input type="hidden" name="reservationId" value={item.id} />
									<button type="submit">Stiahnuť</button>
								</form>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{:else}
			<div class="folio-pane" id="panel-historia" role="tabpanel" aria-labelledby="tab-historia">
				{#if data.history.length === 0}
					<div class="folio-empty is-quiet">
						<div class="folio-empty-copy">
							<h3>Ešte žiadna vrátená kniha</h3>
							<p>Keď knihu nahlásiš na pult a pult ju naskenuje, ostane tu ako záznam.</p>
						</div>
					</div>
				{:else}
					<form class="folio-clear" method="POST" action="?/clearHistory" use:enhance={applyToast()}>
						<p>Vrátené ostávajú na lístku, kým ich stiahneš.</p>
						<button type="submit">Vyčistiť vrátené</button>
					</form>
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

		<p class="folio-serial">lístok {serial} · pav. B</p>
	</article>
</section>

<style>
	.folio {
		--ink: #2c1d16;
		--muted: #7a6554;
		--rule: #d7c4ae;
		--stamp: #c45a38;
		--ticket: #fff8ee;
		--shadow: 0 1.6rem 2.8rem -1.4rem color-mix(in srgb, #2c1d16 42%, transparent);
		position: relative;
		isolation: isolate;
		display: grid;
		min-width: 0;
		max-width: 64rem;
		margin: 0 auto 1.5rem;
		gap: 1.75rem;
	}

	:global(html.dark) .folio {
		--ink: #241710;
		--muted: #6d5848;
		--rule: #cbb79f;
		--ticket: #f4eadc;
		--shadow: 0 2.2rem 3.4rem -1.2rem rgb(0 0 0 / 0.55);
	}

	.folio-copy {
		position: relative;
		z-index: 1;
		max-width: 28rem;
		padding-top: 0.2rem;
		animation: folio-rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}

	.folio-kicker {
		margin: 0;
		color: var(--muted-foreground);
		font-family: var(--font-mono, 'Azeret Mono', monospace);
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.22em;
		text-transform: uppercase;
	}

	.folio-display {
		margin: 0.85rem 0 0;
		max-width: 9ch;
		color: var(--foreground);
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-size: clamp(2.6rem, 8vw, 4.5rem);
		font-weight: 700;
		line-height: 0.9;
		letter-spacing: -0.045em;
		text-wrap: balance;
	}

	.folio-lede {
		margin: 1.15rem 0 0;
		max-width: 22rem;
		color: var(--muted-foreground);
		font-family: var(--font-body, 'Literata', serif);
		font-size: 1.12rem;
		line-height: 1.45;
	}

	.folio-facts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin: 1.35rem 0 0;
		padding: 0;
		list-style: none;
	}

	.folio-facts li {
		border: 1px solid color-mix(in srgb, var(--foreground) 16%, transparent);
		border-radius: 999px;
		padding: 0.28rem 0.7rem;
		color: var(--foreground);
		font-family: var(--font-mono, 'Azeret Mono', monospace);
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.folio-card {
		position: relative;
		z-index: 2;
		overflow: hidden;
		min-width: 0;
		padding: 1.3rem 1.3rem 1rem 2.15rem;
		border: 1px solid color-mix(in srgb, var(--ink) 14%, transparent);
		border-radius: 1.15rem;
		background:
			radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--stamp) 11%, transparent), transparent 46%),
			var(--ticket);
		color: var(--ink);
		box-shadow: var(--shadow);
		transform: rotate(-1.35deg);
		transform-origin: 72% 86%;
		transition: transform 0.4s ease;
		animation: folio-card-in 0.9s 0.08s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}

	.folio-card::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.22;
		mix-blend-mode: multiply;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
	}

	.folio-spine {
		position: absolute;
		top: 0.9rem;
		bottom: 0.9rem;
		left: 0;
		width: 0.42rem;
		background: linear-gradient(180deg, #c45a38, #3c2a21 62%, #c45a38);
	}

	.folio-holes {
		position: absolute;
		top: 1.25rem;
		bottom: 1.25rem;
		left: 0.72rem;
		z-index: 2;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.folio-holes span {
		display: block;
		width: 0.72rem;
		height: 0.72rem;
		border: 1px solid color-mix(in srgb, var(--ink) 18%, transparent);
		border-radius: 999px;
		background: var(--paper);
		box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.18);
	}

	.folio-id,
	.folio-tabs,
	.folio-note,
	.folio-pane,
	.folio-serial,
	.folio-perf,
	.folio-clear {
		position: relative;
		z-index: 1;
	}

	.folio-id {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.35rem 1rem;
		margin: 0 0 1.1rem;
		align-items: start;
	}

	.folio-mark {
		grid-column: 1;
		margin: 0;
		color: var(--muted);
		font-family: var(--font-mono, 'Azeret Mono', monospace);
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.folio-stamp {
		grid-column: 2;
		grid-row: 1 / 3;
		justify-self: end;
		align-self: start;
		margin: 0.1rem 0 0;
		padding: 0.38rem 0.48rem 0.28rem;
		border: 2px solid color-mix(in srgb, var(--stamp) 78%, var(--ink));
		border-radius: 999px;
		color: var(--stamp);
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-size: 0.72rem;
		font-style: italic;
		font-weight: 700;
		letter-spacing: 0.14em;
		line-height: 1;
		text-transform: uppercase;
		transform: rotate(8deg);
		opacity: 0.88;
		mix-blend-mode: multiply;
		pointer-events: none;
	}

	.folio-who {
		grid-column: 1;
		min-width: 0;
	}

	.folio-who h2 {
		margin: 0.15rem 0 0;
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-size: clamp(1.55rem, 4vw, 2.05rem);
		font-weight: 650;
		line-height: 1.05;
		letter-spacing: -0.035em;
	}

	.folio-who p {
		margin: 0.28rem 0 0;
		color: var(--muted);
		font-family: var(--font-mono, 'Azeret Mono', monospace);
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.folio-shelf {
		grid-column: 1 / -1;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 0.8rem;
		margin-top: 0.85rem;
		padding-top: 0.85rem;
		border-top: 1px solid color-mix(in srgb, var(--ink) 10%, transparent);
	}

	.folio-slots {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.28rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.folio-slots li {
		position: relative;
		width: 1.05rem;
		height: 2.35rem;
		border: 1.5px solid color-mix(in srgb, var(--ink) 22%, transparent);
		border-radius: 1px 4px 3px 1px;
		background:
			linear-gradient(90deg, color-mix(in srgb, var(--ink) 10%, transparent), transparent 40%),
			color-mix(in srgb, var(--ink) 5%, transparent);
		transform: skewX(-7deg);
		box-shadow: inset -1px 0 0 color-mix(in srgb, var(--ink) 8%, transparent);
	}

	.folio-slots li::after {
		content: attr(data-n);
		position: absolute;
		inset: auto 0 0.18rem;
		color: var(--muted);
		font-family: var(--font-mono, 'Azeret Mono', monospace);
		font-size: 0.48rem;
		font-weight: 700;
		letter-spacing: 0;
		text-align: center;
		transform: skewX(7deg);
	}

	.folio-slots li.taken {
		border-color: color-mix(in srgb, var(--stamp) 55%, var(--ink));
		background: linear-gradient(180deg, #d46a48 0%, #c45a38 42%, #8a3a26 100%);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.22),
			2px 4px 8px -4px color-mix(in srgb, var(--ink) 35%, transparent);
	}

	.folio-slots li.taken::after {
		color: #fff8ee;
	}

	.folio-quota {
		margin: 0 0 0.15rem;
		color: var(--muted);
		font-family: var(--font-mono, 'Azeret Mono', monospace);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.08em;
	}

	.folio-note {
		margin: 0 0 0.95rem;
		padding: 0.7rem 0.8rem;
		border-left: 3px solid var(--stamp);
		background: color-mix(in srgb, var(--stamp) 10%, var(--ticket));
		color: #9a3b28;
		font-family: var(--font-body, 'Literata', serif);
		font-size: 0.95rem;
	}

	.folio-tabs {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 0.35rem;
		margin: 0 0 0.15rem;
		padding: 0.28rem;
		border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
		border-radius: 999px;
		background: color-mix(in srgb, var(--ink) 5%, transparent);
	}

	.folio-tabs button {
		appearance: none;
		border: 0;
		border-radius: 999px;
		padding: 0.55rem 0.4rem;
		background: transparent;
		color: var(--muted);
		cursor: pointer;
		font-family: var(--font-body, 'Literata', serif);
		font-size: 0.92rem;
		transition: background 0.2s ease, color 0.2s ease;
	}

	.folio-tabs button em {
		margin-left: 0.15rem;
		font-family: var(--font-mono, 'Azeret Mono', monospace);
		font-size: 0.72rem;
		font-style: normal;
		font-weight: 700;
		letter-spacing: 0.04em;
	}

	.folio-tabs button[aria-selected='true'] {
		background: var(--ink);
		color: var(--ticket);
	}

	.folio-tabs button:focus-visible {
		outline: 2px solid var(--stamp);
		outline-offset: 2px;
	}

	.folio-perf {
		height: 0;
		margin: 0.95rem -1.3rem 1.1rem -2.15rem;
		border-top: 1px dashed var(--rule);
	}

	.folio-perf::before,
	.folio-perf::after {
		content: '';
		position: absolute;
		top: -0.42rem;
		width: 0.84rem;
		height: 0.84rem;
		border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
		border-radius: 999px;
		background: var(--paper);
	}

	.folio-perf::before {
		left: -0.42rem;
	}

	.folio-perf::after {
		right: -0.42rem;
	}

	.folio-pane {
		animation: folio-pane 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}

	.folio-empty {
		position: relative;
		display: grid;
		gap: 1.1rem;
		min-height: 11.5rem;
		padding: 0.15rem 0 0.2rem;
	}

	.folio-empty.is-quiet {
		min-height: 6.5rem;
	}

	.folio-ghosts {
		position: absolute;
		right: -0.4rem;
		bottom: 0.15rem;
		display: flex;
		align-items: flex-end;
		gap: 0.35rem;
		pointer-events: none;
	}

	.folio-ghosts span {
		display: block;
		width: 2.35rem;
		height: 3.5rem;
		border: 1.5px dashed color-mix(in srgb, var(--ink) 22%, transparent);
		border-radius: 2px 6px 4px 2px;
		background: color-mix(in srgb, var(--ink) 4%, transparent);
		transform: rotate(calc((var(--n) - 2) * 6deg)) translateY(calc(var(--n) * 0.12rem));
		box-shadow: 0 8px 14px -10px color-mix(in srgb, var(--ink) 40%, transparent);
	}

	.folio-empty-copy {
		position: relative;
		z-index: 1;
		max-width: 18rem;
	}

	.folio-empty h3 {
		margin: 0;
		max-width: 14ch;
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-size: clamp(1.45rem, 3.4vw, 1.85rem);
		font-weight: 650;
		line-height: 1.08;
		letter-spacing: -0.03em;
	}

	.folio-empty p {
		margin: 0.45rem 0 0;
		max-width: 28ch;
		color: var(--muted);
		font-family: var(--font-body, 'Literata', serif);
		font-size: 1.02rem;
		line-height: 1.4;
	}

	.folio-go {
		position: relative;
		z-index: 1;
		justify-self: start;
		display: grid;
		place-items: center;
		width: 5.6rem;
		height: 5.6rem;
		border: 2px solid color-mix(in srgb, var(--stamp) 80%, var(--ink));
		border-radius: 999px;
		background: color-mix(in srgb, var(--stamp) 8%, var(--ticket));
		color: var(--stamp);
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-size: 0.78rem;
		font-style: italic;
		font-weight: 700;
		letter-spacing: 0.02em;
		line-height: 1.15;
		text-align: center;
		text-decoration: none;
		text-wrap: balance;
		transform: rotate(-8deg);
		mix-blend-mode: multiply;
		transition: transform 0.25s ease, background 0.25s ease;
	}

	.folio-go:hover {
		background: var(--stamp);
		color: var(--ticket);
		transform: rotate(-3deg) scale(1.04);
		mix-blend-mode: normal;
	}

	.folio-slips {
		display: grid;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.slip {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.85rem 0.95rem;
		padding: 0.55rem 0.15rem 0.65rem;
		border-bottom: 1px dotted var(--rule);
	}

	.slip:last-child {
		border-bottom: 0;
	}

	.slip :global(.jacket) {
		box-shadow: 0 8px 14px rgb(40 32 18 / 0.16);
		transform: rotate(-3deg);
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
		font-family: var(--font-display, 'Cormorant Garamond', serif);
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
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-size: 1.08rem;
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
		font-family: var(--font-body, 'Literata', serif);
		font-size: 0.92rem;
	}

	.slip-when {
		font-family: var(--font-mono, 'Azeret Mono', monospace);
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.slip form button {
		appearance: none;
		border: 1.5px solid color-mix(in srgb, var(--stamp) 70%, var(--ink));
		border-radius: 999px;
		padding: 0.48rem 0.85rem;
		background: transparent;
		color: #9a3b28;
		cursor: pointer;
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-size: 0.78rem;
		font-style: italic;
		font-weight: 700;
		letter-spacing: 0.04em;
		transform: rotate(4deg);
		transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
	}

	.slip-acts {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.4rem;
	}

	.slip-wait {
		margin: 0;
		padding: 0.48rem 0.7rem;
		border: 1.5px dashed color-mix(in srgb, var(--stamp) 55%, var(--ink));
		border-radius: 999px;
		color: var(--stamp);
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-size: 0.72rem;
		font-style: italic;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-align: center;
		transform: rotate(3deg);
	}

	.slip form button.is-renew {
		border-color: color-mix(in srgb, #3f6b48 70%, var(--ink));
		color: #3f6b48;
		transform: rotate(-4deg);
	}

	.slip form button:hover {
		background: #9a3b28;
		color: var(--ticket);
		transform: rotate(0deg);
	}

	.slip form button.is-renew:hover {
		background: #3f6b48;
		color: var(--ticket);
	}

	.folio-clear {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.7rem 1rem;
		margin: 0 0 0.85rem;
		padding: 0.15rem 0 0.85rem;
		border-bottom: 1px dashed var(--rule);
	}

	.folio-clear p {
		margin: 0;
		max-width: 22ch;
		color: var(--muted);
		font-family: var(--font-body, 'Literata', serif);
		font-size: 0.95rem;
		line-height: 1.35;
	}

	.folio-clear button {
		appearance: none;
		border: 1.5px solid color-mix(in srgb, var(--ink) 22%, transparent);
		border-radius: 999px;
		padding: 0.48rem 0.9rem;
		background: transparent;
		color: var(--ink);
		cursor: pointer;
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-size: 0.78rem;
		font-style: italic;
		font-weight: 700;
		letter-spacing: 0.04em;
		transform: rotate(-3deg);
		transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
	}

	.folio-clear button:hover {
		background: var(--ink);
		color: var(--ticket);
		transform: rotate(0deg);
	}

	.folio-ledger {
		margin: 0;
		padding: 0.1rem 0;
		list-style: none;
	}

	.folio-ledger li {
		display: grid;
		grid-template-columns: auto minmax(1.5rem, 1fr) auto;
		align-items: baseline;
		gap: 0.65rem;
		padding: 0.75rem 0.1rem;
		border-bottom: 1px dotted var(--rule);
	}

	.folio-ledger a {
		color: inherit;
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-size: 1.05rem;
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
		font-family: var(--font-mono, 'Azeret Mono', monospace);
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.folio-serial {
		margin: 1.15rem 0 0;
		color: var(--muted);
		font-family: var(--font-mono, 'Azeret Mono', monospace);
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	@media (min-width: 860px) {
		.folio {
			grid-template-columns: minmax(0, 1.05fr) minmax(22rem, 26.5rem);
			align-items: start;
			gap: 0;
			padding: 0.35rem 0 2rem;
		}

		.folio-copy {
			padding-top: 1.15rem;
			padding-right: 4.5rem;
		}

		.folio-card {
			margin-top: 2.4rem;
			margin-left: -2.8rem;
		}

		.folio-card:hover {
			transform: rotate(-0.35deg) translateY(-0.2rem);
		}

		.folio-empty {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: end;
		}

		.folio-go {
			justify-self: end;
			margin-bottom: 0.2rem;
		}
	}

	@keyframes folio-rise {
		from {
			opacity: 0;
			transform: translateY(0.9rem);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes folio-card-in {
		from {
			opacity: 0;
			transform: translateY(1.2rem) rotate(-1.35deg);
		}
		to {
			opacity: 1;
			transform: rotate(-1.35deg);
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
		.folio-card {
			transform: none;
			animation: folio-rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both;
		}

		.folio-ghosts span {
			width: 1.7rem;
			height: 2.55rem;
		}

		.slip {
			grid-template-columns: auto minmax(0, 1fr);
		}

		.slip form,
		.slip-acts {
			grid-column: 1 / -1;
		}

		.slip form button {
			width: 100%;
			transform: none;
		}

		.folio-clear button {
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.folio-copy,
		.folio-card,
		.folio-pane {
			animation: none;
			transform: none;
		}
	}
</style>
