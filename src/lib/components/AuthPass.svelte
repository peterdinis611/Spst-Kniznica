<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		kicker,
		title,
		lede,
		serial = 'PREUKAZ · PAV. B',
		facts = ['7–21 dní', 'bez stropu', 'pavilón B'],
		tabs,
		children
	}: {
		kicker: string;
		title: string;
		lede: string;
		serial?: string;
		facts?: string[];
		tabs?: Snippet;
		children: Snippet;
	} = $props();
</script>

<section class="pass">
	<div class="pass-copy">
		<p class="pass-kicker">{kicker}</p>
		<h2 class="pass-title">{title}</h2>
		<p class="pass-lede">{lede}</p>
		{#if facts.length}
			<ul class="pass-facts">
				{#each facts as fact}
					<li>{fact}</li>
				{/each}
			</ul>
		{/if}
	</div>

	<article class="pass-card">
		<span class="pass-spine" aria-hidden="true"></span>
		<div class="pass-holes" aria-hidden="true">
			<span></span><span></span><span></span><span></span>
		</div>
		<div class="pass-head">
			<p class="pass-mark">čitateľský preukaz</p>
			<p class="pass-stamp" aria-hidden="true">SPŠT</p>
		</div>
		{#if tabs}
			<nav class="pass-tabs" aria-label="Účet">
				{@render tabs()}
			</nav>
		{/if}
		<div class="pass-body">
			{@render children()}
		</div>
		<p class="pass-serial">{serial}</p>
	</article>
</section>

<style>
	.pass {
		--pass-paper: #fff8ee;
		--pass-ink: #2c1d16;
		--pass-muted: #7a6554;
		--pass-rule: #d7c4ae;
		--pass-stamp: #c45a38;
		--pass-hole: var(--paper, #f6f0e6);
		--pass-shadow: 0 1.6rem 2.8rem -1.4rem color-mix(in srgb, #2c1d16 42%, transparent);
		position: relative;
		isolation: isolate;
		display: grid;
		min-width: 0;
		max-width: 64rem;
		margin: 0 auto 1.5rem;
		gap: 1.75rem;
	}

	:global(html.dark) .pass {
		--pass-paper: #f4eadc;
		--pass-ink: #241710;
		--pass-muted: #6d5848;
		--pass-rule: #cbb79f;
		--pass-hole: #16120e;
		--pass-shadow: 0 2.2rem 3.4rem -1.2rem rgb(0 0 0 / 0.55);
	}

	.pass-copy {
		position: relative;
		z-index: 1;
		max-width: 28rem;
		padding-top: 0.35rem;
		animation: pass-rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}

	.pass-kicker {
		margin: 0;
		color: var(--muted-foreground);
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.22em;
		text-transform: uppercase;
	}

	.pass-title {
		margin: 0.85rem 0 0;
		max-width: 11ch;
		color: var(--foreground);
		font-family: var(--font-display, Fraunces, serif);
		font-size: clamp(2.6rem, 8vw, 4.6rem);
		font-weight: 700;
		line-height: 0.92;
		letter-spacing: -0.045em;
		text-wrap: balance;
		font-variation-settings: 'SOFT' 28, 'WONK' 1;
	}

	.pass-lede {
		margin: 1.15rem 0 0;
		max-width: 22rem;
		color: var(--muted-foreground);
		font-family: var(--font-body, Newsreader, serif);
		font-size: 1.12rem;
		line-height: 1.45;
	}

	.pass-facts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin: 1.35rem 0 0;
		padding: 0;
		list-style: none;
	}

	.pass-facts li {
		border: 1px solid color-mix(in srgb, var(--foreground) 16%, transparent);
		border-radius: 999px;
		padding: 0.28rem 0.7rem;
		color: var(--foreground);
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.pass-card {
		position: relative;
		z-index: 2;
		overflow: hidden;
		min-width: 0;
		padding: 1.35rem 1.35rem 1.1rem 2.15rem;
		border: 1px solid color-mix(in srgb, var(--pass-ink) 14%, transparent);
		border-radius: 1.15rem;
		background:
			radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--pass-stamp) 10%, transparent), transparent 46%),
			var(--pass-paper);
		color: var(--pass-ink);
		box-shadow: var(--pass-shadow);
		transform: rotate(-1.35deg);
		transform-origin: 72% 86%;
		transition: transform 0.4s ease;
		animation: pass-card-in 0.9s 0.08s cubic-bezier(0.2, 0.7, 0.2, 1) both;
	}

	.pass-card::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.22;
		mix-blend-mode: multiply;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
	}

	.pass-spine {
		position: absolute;
		top: 0.9rem;
		bottom: 0.9rem;
		left: 0;
		width: 0.42rem;
		background: linear-gradient(180deg, #c45a38, #3c2a21 62%, #c45a38);
	}

	.pass-holes {
		position: absolute;
		top: 1.35rem;
		bottom: 1.35rem;
		left: 0.72rem;
		z-index: 2;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.pass-holes span {
		display: block;
		width: 0.72rem;
		height: 0.72rem;
		border: 1px solid color-mix(in srgb, var(--pass-ink) 18%, transparent);
		border-radius: 999px;
		background: var(--pass-hole);
		box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.18);
	}

	.pass-head {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin: 0 0 1rem;
		min-height: 2.35rem;
	}

	.pass-mark {
		margin: 0;
		color: var(--pass-muted);
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.pass-stamp {
		position: relative;
		flex: 0 0 auto;
		z-index: 1;
		margin: 0;
		padding: 0.38rem 0.48rem 0.28rem;
		border: 2px solid color-mix(in srgb, var(--pass-stamp) 78%, var(--pass-ink));
		border-radius: 999px;
		color: var(--pass-stamp);
		font-family: var(--font-display, Fraunces, serif);
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

	.pass-tabs {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.35rem;
		margin: 0 0 1.35rem;
		padding: 0.28rem;
		border: 1px solid color-mix(in srgb, var(--pass-ink) 12%, transparent);
		border-radius: 999px;
		background: color-mix(in srgb, var(--pass-ink) 5%, transparent);
	}

	.pass-body {
		position: relative;
		z-index: 1;
	}

	.pass-serial {
		position: relative;
		z-index: 1;
		margin: 1.15rem 0 0;
		color: var(--pass-muted);
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	:global(.pass-tabs a) {
		display: grid;
		place-items: center;
		min-height: 2.15rem;
		border-radius: 999px;
		color: var(--pass-muted);
		font-family: var(--font-sans, 'IBM Plex Sans', sans-serif);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-decoration: none;
		transition:
			background 0.2s ease,
			color 0.2s ease;
	}

	:global(.pass-tabs a.is-on) {
		background: var(--pass-ink);
		color: var(--pass-paper);
	}

	:global(.pass-form) {
		display: grid;
		gap: 1.05rem;
	}

	:global(.pass-field) {
		display: grid;
		gap: 0.28rem;
	}

	:global(.pass-field label) {
		color: var(--pass-muted);
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.64rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	:global(.pass-field input) {
		width: 100%;
		height: 2.7rem;
		padding: 0 0.1rem 0.2rem;
		border: 0;
		border-bottom: 1px solid var(--pass-rule);
		border-radius: 0;
		background: transparent;
		color: var(--pass-ink);
		font-family: var(--font-body, Newsreader, serif);
		font-size: 1.12rem;
		box-shadow: none;
		outline: none;
	}

	:global(.pass-field.is-bad input),
	:global(.pass-field.is-bad .pass-secret-input) {
		border-bottom-color: var(--pass-stamp);
	}

	:global(.pass-secret) {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: end;
		gap: 0.45rem;
	}

	:global(.pass-secret-input) {
		padding-right: 0.2rem;
	}

	:global(.pass-peek) {
		height: 2.7rem;
		margin: 0;
		padding: 0 0.1rem 0.2rem;
		border: 0;
		border-bottom: 1px solid var(--pass-rule);
		background: transparent;
		color: var(--pass-muted);
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		cursor: pointer;
	}

	:global(.pass-peek:hover),
	:global(.pass-peek[aria-pressed='true']) {
		color: var(--pass-ink);
		border-bottom-color: var(--pass-ink);
	}

	:global(.pass-error) {
		margin: 0.2rem 0 0;
		color: var(--pass-stamp);
		font-family: var(--font-body, Newsreader, serif);
		font-size: 0.88rem;
		line-height: 1.3;
	}

	:global(.pass-meter) {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		margin: 0.15rem 0 0;
		color: var(--pass-muted);
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	:global(.pass-meter-bars) {
		display: grid;
		grid-template-columns: repeat(3, 1.15rem);
		gap: 0.2rem;
	}

	:global(.pass-meter-bars i) {
		display: block;
		height: 0.28rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--pass-ink) 12%, transparent);
	}

	:global(.pass-meter[data-sila='1'] .pass-meter-bars i:nth-child(1)) {
		background: var(--pass-stamp);
	}

	:global(.pass-meter[data-sila='2'] .pass-meter-bars i:nth-child(-n + 2)) {
		background: #b5812b;
	}

	:global(.pass-meter[data-sila='3'] .pass-meter-bars i) {
		background: #3f5a32;
	}

	:global(.pass-field input:focus-visible),
	:global(.pass-go:focus-visible),
	:global(.pass-peek:focus-visible),
	:global(.pass-tabs a:focus-visible),
	:global(.pass-actions a:focus-visible) {
		outline: 2px solid var(--pass-stamp);
		outline-offset: 3px;
	}

	:global(.pass-help) {
		margin: -0.35rem 0 0;
		text-align: right;
	}

	:global(.pass-help a),
	:global(.pass-back) {
		color: var(--pass-muted);
		font-family: var(--font-sans, 'IBM Plex Sans', sans-serif);
		font-size: 0.78rem;
		text-decoration: none;
		text-underline-offset: 0.22em;
	}

	:global(.pass-help a:hover),
	:global(.pass-back:hover) {
		color: var(--pass-ink);
		text-decoration: underline;
	}

	:global(.pass-back) {
		display: block;
		margin-top: 0.15rem;
		text-align: center;
	}

	:global(.pass-note) {
		padding: 0.7rem 0.8rem;
		border-left: 3px solid var(--pass-stamp);
		background: color-mix(in srgb, var(--pass-stamp) 10%, var(--pass-paper));
		color: var(--pass-ink);
		font-family: var(--font-body, Newsreader, serif);
		font-size: 0.92rem;
		line-height: 1.4;
	}

	:global(.pass-note.is-ok) {
		border-left-color: #3f5a32;
		background: color-mix(in srgb, #3f5a32 10%, var(--pass-paper));
	}

	:global(.pass-note code) {
		font-family: var(--font-mono, 'IBM Plex Mono', monospace);
		font-size: 0.78em;
	}

	:global(.pass-go) {
		display: grid;
		place-items: center;
		width: 100%;
		min-height: 2.85rem;
		margin-top: 0.2rem;
		border: 0;
		border-radius: 0.2rem;
		background: var(--pass-ink);
		color: var(--pass-paper);
		font-family: var(--font-display, Fraunces, serif);
		font-size: 1.05rem;
		font-weight: 650;
		letter-spacing: -0.02em;
		cursor: pointer;
		transition: transform 0.15s ease, opacity 0.15s ease;
	}

	:global(.pass-go:hover:not(:disabled)) {
		transform: translateY(-1px);
	}

	:global(.pass-go:disabled) {
		cursor: not-allowed;
		opacity: 0.42;
	}

	:global(.pass-actions) {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		margin-top: 0.35rem;
	}

	:global(.pass-actions a) {
		display: inline-grid;
		place-items: center;
		min-height: 2.5rem;
		padding: 0 0.95rem;
		border: 1px solid color-mix(in srgb, var(--pass-ink) 18%, transparent);
		border-radius: 0.2rem;
		color: var(--pass-ink);
		font-family: var(--font-sans, 'IBM Plex Sans', sans-serif);
		font-size: 0.84rem;
		font-weight: 600;
		text-decoration: none;
	}

	:global(.pass-actions a.is-ink) {
		border-color: var(--pass-ink);
		background: var(--pass-ink);
		color: var(--pass-paper);
	}

	@media (min-width: 860px) {
		.pass {
			grid-template-columns: minmax(0, 1.05fr) minmax(20rem, 24.5rem);
			align-items: start;
			gap: 0;
			padding: 0.5rem 0 2rem;
		}

		.pass-copy {
			padding-top: 1.4rem;
			padding-right: 5.5rem;
		}

		.pass-card {
			margin-top: 3.4rem;
			margin-left: -3.4rem;
		}

		.pass-card:hover {
			transform: rotate(-0.35deg) translateY(-0.2rem);
		}
	}

	@keyframes pass-rise {
		from {
			opacity: 0;
			transform: translateY(0.9rem);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes pass-card-in {
		from {
			opacity: 0;
			transform: translateY(1.2rem) rotate(-1.35deg);
		}
		to {
			opacity: 1;
			transform: rotate(-1.35deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pass-copy,
		.pass-card {
			animation: none;
			transform: none;
		}
	}
</style>
