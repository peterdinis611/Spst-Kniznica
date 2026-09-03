<script lang="ts">
	import { resolve } from '$app/paths';

	let {
		status,
		message
	}: {
		status: number;
		message?: string;
	} = $props();

	const jammed = $derived(status >= 500);
	const digits = $derived(String(status).split(''));
	const stamp = $derived(jammed ? 'PORUCHA' : 'CHÝBA');
	const kicker = $derived(jammed ? 'Porucha pultu' : 'Katalógová poznámka');
	const title = $derived(jammed ? 'Zásuvka sa zasekla.' : 'Karta nie je v zásuvke.');
	const leaked = $derived(
		!!message && /ENOENT|EACCES|EPERM|\.svelte-kit|node_modules|\/Users\/|\/home\/|Not Found|Internal Error/.test(message)
	);
	const lead = $derived(
		jammed || leaked || !message
			? jammed
				? 'Fond túto kartu teraz neotvorí. Skús znova, alebo sa vráť na sieň.'
				: 'Signatúra v registri nie je — alebo ju niekto vrátil do nesprávneho šuplíka.'
			: message
	);

	function retry() {
		location.reload();
	}
</script>

<main id="obsah" class="fault" data-kind={jammed ? 'jammed' : 'missing'} aria-labelledby="fault-title">
	<div class="fault-grain" aria-hidden="true"></div>
	<div class="fault-wash" aria-hidden="true"></div>

	<p class="fault-kicker">{kicker} · {status}</p>

	<div class="fault-grid">
		<div class="fault-stage" aria-hidden="true">
			<svg class="fault-drawer" viewBox="0 0 360 260" fill="none">
				<rect class="cabinet" x="18" y="28" width="324" height="204" rx="10" />
				<rect class="cabinet-lip" x="18" y="28" width="324" height="22" rx="10" />
				<path class="cabinet-rule" d="M34 62h292" />
				<rect class="well" x="38" y="78" width="284" height="132" rx="6" />
				<g class="drawer-face">
					<rect x="46" y="86" width="268" height="116" rx="5" />
					<rect class="plate" x="138" y="128" width="84" height="28" rx="3" />
					<circle class="knob" cx="180" cy="142" r="7" />
				</g>
				{#if jammed}
					<path class="crack" d="M78 92l22 38-14 24 28 36" />
					<ellipse class="blot" cx="268" cy="168" rx="34" ry="22" />
				{/if}
			</svg>

			<div class="fault-card" class:is-torn={jammed}>
				<span>SPŠT · lístok</span>
				<strong>{jammed ? 'Zaseknutý výpis' : 'Prázdna signatúra'}</strong>
				<em>{jammed ? 'pult neodpovedá' : 'zásuvka prázdna'}</em>
			</div>

			<div class="fault-digits">
				{#each digits as digit, i (i)}
					<span style="--i: {i}">{digit}</span>
				{/each}
			</div>

			<div class="fault-stamp">{stamp}</div>
		</div>

		<div class="fault-copy">
			<h1 id="fault-title">{title}</h1>
			<p>{lead}</p>
			<nav aria-label="Čo ďalej">
				{#if jammed}
					<button type="button" class="fault-cta" onclick={retry}>Skúsiť znova</button>
				{:else}
					<a class="fault-cta no-underline" href={resolve('/discover')}>Do fondu</a>
				{/if}
				<a class="fault-ghost no-underline" href={resolve('/')}>Na sieň</a>
			</nav>
		</div>
	</div>
</main>

<style>
	.fault {
		--fault-ink: #3c2a21;
		--fault-page: #f6f0e6;
		--fault-card: #fffaf3;
		--fault-muted: #7a6a5c;
		--fault-line: #e6dccb;
		--fault-stamp: #c56a4a;
		--fault-wood: #2a1c16;
		position: relative;
		overflow: clip;
		min-height: 100dvh;
		padding: 1.1rem 0.9rem 2.2rem;
		color: var(--fault-ink);
		background: var(--fault-page);
	}

	:global(html.dark) .fault {
		--fault-ink: #f3eadf;
		--fault-page: #16120e;
		--fault-card: #221c16;
		--fault-muted: #b7ab98;
		--fault-line: #3a342c;
		--fault-stamp: #e08a6a;
		--fault-wood: #0e0b08;
	}

	.fault-grain,
	.fault-wash {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.fault-grain {
		opacity: 0.28;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E");
		animation: fault-fade 0.8s ease both;
	}

	.fault-wash {
		background:
			radial-gradient(ellipse at 18% 30%, color-mix(in srgb, var(--fault-stamp) 16%, transparent), transparent 42%),
			radial-gradient(ellipse at 88% 80%, color-mix(in srgb, var(--fault-ink) 10%, transparent), transparent 46%);
	}

	.fault-kicker {
		position: relative;
		z-index: 1;
		margin: 0;
		color: var(--fault-muted);
		font-family: 'Bricolage Grotesque', sans-serif;
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		animation: fault-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	.fault-grid {
		position: relative;
		z-index: 1;
		display: grid;
		align-items: center;
		gap: 1.6rem 2.4rem;
		min-height: calc(100dvh - 5rem);
	}

	@media (min-width: 960px) {
		.fault-grid {
			grid-template-columns: 1.05fr 0.95fr;
			padding-inline: 1.4rem;
		}
	}

	.fault-stage {
		position: relative;
		min-height: 16rem;
		margin-left: 0;
	}

	@media (min-width: 640px) {
		.fault-stage {
			min-height: 22rem;
			margin-left: -0.6rem;
		}
	}

	.fault-drawer {
		width: min(100%, 34rem);
		filter: drop-shadow(0 28px 40px rgb(40 28 16 / 0.22));
		animation: fault-drawer 1s cubic-bezier(0.22, 1.15, 0.36, 1) 0.08s both;
	}

	.cabinet {
		fill: var(--fault-wood);
	}

	.cabinet-lip {
		fill: color-mix(in srgb, var(--fault-wood) 72%, #6b4a32);
	}

	.cabinet-rule,
	.well {
		stroke: color-mix(in srgb, var(--fault-page) 18%, transparent);
	}

	.well {
		fill: color-mix(in srgb, #000 35%, var(--fault-wood));
	}

	.drawer-face rect {
		fill: color-mix(in srgb, var(--fault-wood) 55%, #8a5a38);
	}

	.plate {
		fill: color-mix(in srgb, var(--fault-page) 22%, #c4a574);
		stroke: rgb(40 28 16 / 0.28);
	}

	.knob {
		fill: #d8c4a0;
	}

	.crack {
		stroke: var(--fault-stamp);
		stroke-width: 2.2;
		stroke-linecap: round;
		opacity: 0;
		animation: fault-ink 0.4s ease 0.9s both;
	}

	.blot {
		fill: color-mix(in srgb, var(--fault-stamp) 55%, #2a1c16);
		transform-origin: 268px 168px;
		animation: fault-blot 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.72s both;
	}

	.fault-card {
		position: absolute;
		top: 18%;
		left: 18%;
		display: grid;
		gap: 0.25rem;
		width: min(16.5rem, 62%);
		padding: 1rem 1.1rem 1.15rem;
		border: 1px solid var(--fault-line);
		background: var(--fault-card);
		box-shadow: 0 18px 32px rgb(40 28 16 / 0.16);
		transform: rotate(-8deg);
		animation: fault-card 0.85s cubic-bezier(0.22, 1.2, 0.36, 1) 0.32s both;
	}

	.fault-card.is-torn {
		clip-path: polygon(0 0, 100% 0, 100% 72%, 86% 78%, 100% 88%, 92% 100%, 0 100%);
		transform: rotate(7deg);
	}

	.fault-card span,
	.fault-card em {
		font-family: 'Bricolage Grotesque', sans-serif;
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--fault-muted);
	}

	.fault-card strong {
		font-family: 'Cormorant Garamond', serif;
		font-size: 1.25rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		line-height: 1.05;
	}

	.fault-digits {
		position: absolute;
		right: 2%;
		bottom: 6%;
		display: flex;
		gap: 0.08em;
		font-family: 'Oswald', 'Cormorant Garamond', serif;
		font-size: clamp(4.2rem, 22vw, 11rem);
		font-weight: 800;
		line-height: 0.72;
		letter-spacing: -0.06em;
		color: var(--fault-ink);
		mix-blend-mode: multiply;
		pointer-events: none;
	}

	:global(html.dark) .fault-digits {
		mix-blend-mode: screen;
		opacity: 0.92;
	}

	.fault-digits span {
		display: block;
		animation: fault-digit 0.7s cubic-bezier(0.22, 1.25, 0.36, 1) both;
		animation-delay: calc(0.48s + var(--i) * 0.1s);
	}

	.fault[data-kind='jammed'] .fault-digits span:nth-child(2) {
		animation-name: fault-digit-glitch;
	}

	.fault-stamp {
		position: absolute;
		top: 8%;
		right: 8%;
		padding: 0.35rem 0.7rem;
		border: 3px solid var(--fault-stamp);
		border-radius: 0.35rem;
		color: var(--fault-stamp);
		font-family: 'Cormorant Garamond', serif;
		font-size: clamp(1.4rem, 3vw, 2rem);
		font-style: italic;
		font-weight: 800;
		letter-spacing: 0.08em;
		transform: rotate(-14deg);
		animation: fault-stamp 0.55s cubic-bezier(0.2, 1.4, 0.3, 1) 0.95s both;
	}

	.fault-copy {
		max-width: 28rem;
		padding-bottom: 1rem;
	}

	.fault-copy h1 {
		margin: 0;
		max-width: 11ch;
		font-family: 'Cormorant Garamond', serif;
		font-size: clamp(2.6rem, 6vw, 4.4rem);
		font-weight: 700;
		letter-spacing: -0.04em;
		line-height: 0.92;
		animation: fault-rise 0.75s cubic-bezier(0.22, 1, 0.36, 1) 0.28s both;
	}

	.fault-copy p {
		margin: 1.1rem 0 0;
		max-width: 34ch;
		color: var(--fault-muted);
		font-family: 'Literata', serif;
		font-size: 1.2rem;
		line-height: 1.45;
		animation: fault-rise 0.75s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both;
	}

	.fault-copy nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
		margin-top: 1.7rem;
		animation: fault-rise 0.75s cubic-bezier(0.22, 1, 0.36, 1) 0.52s both;
	}

	.fault-cta,
	.fault-ghost {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 3rem;
		padding: 0 1.35rem;
		border: 0;
		border-radius: 999px;
		font-family: 'Bricolage Grotesque', sans-serif;
		font-size: 0.92rem;
		font-weight: 600;
		cursor: pointer;
		text-decoration: none;
	}

	.fault-cta {
		background: var(--fault-ink);
		color: var(--fault-page);
	}

	.fault-ghost {
		background: transparent;
		color: var(--fault-ink);
		box-shadow: inset 0 0 0 1.5px var(--fault-ink);
	}

	.fault-cta:hover,
	.fault-ghost:hover {
		transform: translateY(-2px);
	}

	@keyframes fault-fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 0.28;
		}
	}

	@keyframes fault-ink {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes fault-rise {
		from {
			opacity: 0;
			transform: translateY(18px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes fault-drawer {
		from {
			opacity: 0;
			transform: translate(-12%, 8%) rotate(-6deg);
		}
		to {
			opacity: 1;
			transform: rotate(-2deg);
		}
	}

	@keyframes fault-card {
		from {
			opacity: 0;
			transform: translate(-28%, 20%) rotate(-22deg);
		}
		to {
			opacity: 1;
		}
	}

	@keyframes fault-digit {
		from {
			opacity: 0;
			transform: translateY(0.35em) rotate(-8deg);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes fault-digit-glitch {
		0% {
			opacity: 0;
			transform: translate(8px, 0.4em) skewX(12deg);
		}
		55% {
			transform: translate(-3px, 0) skewX(-6deg);
		}
		100% {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes fault-stamp {
		from {
			opacity: 0;
			transform: rotate(-38deg) scale(1.55);
		}
		to {
			opacity: 1;
			transform: rotate(-14deg) scale(1);
		}
	}

	@keyframes fault-blot {
		from {
			opacity: 0;
			transform: scale(0.2);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.fault-grain,
		.fault-kicker,
		.fault-drawer,
		.fault-card,
		.fault-digits span,
		.fault-stamp,
		.fault-copy h1,
		.fault-copy p,
		.fault-copy nav,
		.blot,
		.crack {
			animation: none;
			opacity: 1;
			transform: none;
		}

		.fault-grain {
			opacity: 0.28;
		}

		.fault-drawer {
			transform: rotate(-2deg);
		}

		.fault-card {
			transform: rotate(-8deg);
		}

		.fault-card.is-torn {
			transform: rotate(7deg);
		}

		.fault-stamp {
			transform: rotate(-14deg);
		}
	}
</style>
