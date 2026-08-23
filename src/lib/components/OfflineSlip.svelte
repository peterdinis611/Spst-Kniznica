<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let { preview }: { preview?: 'offline' | 'restored' } = $props();

	let online = $state(true);
	let restored = $state(false);
	let restoreTimer: ReturnType<typeof setTimeout> | undefined;

	const live = $derived(!preview);
	const showOffline = $derived(preview === 'offline' || (live && !online));
	const showRestored = $derived(preview === 'restored' || (live && restored));

	onMount(() => {
		if (!live) return;

		online = navigator.onLine;

		function clearRestore() {
			if (restoreTimer) clearTimeout(restoreTimer);
			restoreTimer = undefined;
		}

		function goOffline() {
			clearRestore();
			online = false;
			restored = false;
		}

		function goOnline() {
			if (online && !restored) return;
			online = true;
			restored = true;
			clearRestore();
			restoreTimer = setTimeout(() => {
				restored = false;
			}, 3200);
		}

		function sync() {
			if (navigator.onLine) goOnline();
			else goOffline();
		}

		window.addEventListener('offline', goOffline);
		window.addEventListener('online', goOnline);
		window.addEventListener('pageshow', sync);

		return () => {
			clearRestore();
			window.removeEventListener('offline', goOffline);
			window.removeEventListener('online', goOnline);
			window.removeEventListener('pageshow', sync);
		};
	});
</script>

{#if showOffline}
	<div
		class="slip is-off"
		role="alert"
		aria-live="assertive"
		transition:fly={{ y: -28, duration: 420, easing: cubicOut }}
	>
		<p class="slip-kicker">Katalógová poznámka</p>
		<p class="slip-title">Spojenie s pultom padlo.</p>
		<p class="slip-lead">Fond ostáva na obrazovke. Výpožička a hľadanie počkajú, kým sieť naskočí.</p>
		<span class="slip-stamp">Mimo sieť</span>
	</div>
{:else if showRestored}
	<div
		class="slip is-on"
		role="status"
		aria-live="polite"
		transition:fly={{ y: -28, duration: 360, easing: cubicOut }}
	>
		<p class="slip-kicker">Pult znova berie</p>
		<p class="slip-title">Spojenie je späť.</p>
		<p class="slip-lead">Karty a výpožičky znova prechádzajú sieťou.</p>
	</div>
{/if}

<style>
	.slip {
		position: fixed;
		top: max(0.7rem, env(safe-area-inset-top));
		right: 0.7rem;
		left: 0.7rem;
		z-index: 70;
		display: grid;
		gap: 0.2rem;
		max-width: 34rem;
		margin-inline: auto;
		padding: 0.9rem 1rem 1rem;
		border: 1px solid var(--border, #e6dccb);
		background: var(--card, #fffaf3);
		color: var(--foreground, #3c2a21);
		box-shadow: 0 18px 36px rgb(40 28 16 / 0.16);
	}

	.slip-kicker {
		margin: 0;
		color: var(--muted-foreground, #7a6a5c);
		font-family: 'IBM Plex Sans', sans-serif;
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	.slip-title {
		margin: 0.15rem 0 0;
		font-family: 'Fraunces', serif;
		font-size: 1.28rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		line-height: 1.1;
	}

	.slip-lead {
		margin: 0.25rem 0 0;
		max-width: 36ch;
		color: var(--muted-foreground, #7a6a5c);
		font-family: 'Newsreader', serif;
		font-size: 0.98rem;
		line-height: 1.4;
	}

	.slip-stamp {
		justify-self: start;
		margin-top: 0.45rem;
		padding: 0.18rem 0.45rem;
		border: 2px solid var(--chart-2, #c56a4a);
		color: var(--chart-2, #c56a4a);
		font-family: 'Fraunces', serif;
		font-size: 0.72rem;
		font-style: italic;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.slip.is-on {
		border-color: var(--foreground, #3c2a21);
	}

	@media (min-width: 720px) {
		.slip {
			top: 1.15rem;
			right: 1.2rem;
			left: auto;
			width: min(34rem, calc(100vw - 2.4rem));
			margin-inline: 0;
			padding: 0.95rem 6.2rem 1rem 1.15rem;
		}

		.slip-stamp {
			position: absolute;
			top: 0.85rem;
			right: 0.85rem;
			margin-top: 0;
			font-size: 0.78rem;
			transform: rotate(-8deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.slip {
			transition: none;
		}
	}
</style>
