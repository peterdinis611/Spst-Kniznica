<script lang="ts">
	import { navigating } from '$app/state';
	import { fade } from 'svelte/transition';

	let { preview = false }: { preview?: boolean } = $props();

	const pending = $derived(preview || Boolean(navigating.to));
	let visible = $state(false);
	const holes = [0, 1, 2, 3, 4, 5, 6, 7] as const;

	$effect(() => {
		if (!pending) {
			visible = false;
			return;
		}

		if (preview) {
			visible = true;
			return;
		}

		const id = setTimeout(() => {
			visible = true;
		}, 160);

		return () => clearTimeout(id);
	});
</script>

{#if visible}
	<div
		class="wait"
		role="status"
		aria-live="polite"
		aria-busy="true"
		transition:fade={{ duration: 160 }}
	>
		<p class="sr-only">Listujem fond</p>
		<div class="wait-blotter" aria-hidden="true">
			<div class="wait-orbit">
				{#each holes as hole (hole)}
					<span style="--i: {hole}"></span>
				{/each}
			</div>
			<p class="wait-stamp">SPŠT</p>
		</div>
		<p class="wait-copy" aria-hidden="true">Listujem.</p>
	</div>
{/if}

<style>
	.wait {
		--wait-paper: #f6f0e6;
		--wait-ink: #2c1d16;
		--wait-muted: #7a6554;
		--wait-stamp: #c45a38;
		--wait-hole: #fff8ee;
		position: fixed;
		inset: 0;
		z-index: 85;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 1.05rem;
		cursor: wait;
		background:
			radial-gradient(ellipse at 50% 42%, rgb(255 248 238 / 0.42), transparent 58%),
			color-mix(in srgb, var(--wait-paper) 82%, transparent);
		backdrop-filter: blur(2px);
	}

	:global(html.dark) .wait {
		--wait-paper: #16120e;
		--wait-ink: #f4eadc;
		--wait-muted: #b7a392;
		--wait-stamp: #d36b4a;
		--wait-hole: #241710;
		background:
			radial-gradient(ellipse at 50% 42%, rgb(36 23 16 / 0.55), transparent 58%),
			color-mix(in srgb, var(--wait-paper) 78%, transparent);
	}

	.wait::before {
		content: '';
		position: absolute;
		inset: 0;
		opacity: 0.22;
		pointer-events: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
		mix-blend-mode: multiply;
	}

	.wait-blotter {
		position: relative;
		display: grid;
		place-items: center;
		width: 8.6rem;
		height: 8.6rem;
	}

	.wait-orbit {
		position: absolute;
		inset: 0;
		animation: wait-spin 1.15s linear infinite;
	}

	.wait-orbit span {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0.72rem;
		height: 0.72rem;
		border-radius: 999px;
		background: var(--wait-hole);
		box-shadow:
			inset 0 1px 2px rgb(0 0 0 / 0.22),
			0 0 0 1px color-mix(in srgb, var(--wait-ink) 12%, transparent);
		transform: translate(-50%, -50%) rotate(calc(var(--i) * 45deg)) translateY(-3.55rem);
	}

	.wait-stamp {
		position: relative;
		z-index: 1;
		margin: 0;
		padding: 0.55rem 0.62rem 0.42rem;
		border: 2px solid color-mix(in srgb, var(--wait-stamp) 82%, var(--wait-ink));
		border-radius: 999px;
		color: var(--wait-stamp);
		font-family: var(--font-display, 'Cormorant Garamond', serif);
		font-size: 0.92rem;
		font-style: italic;
		font-weight: 700;
		letter-spacing: 0.16em;
		line-height: 1;
		text-transform: uppercase;
		transform: rotate(8deg);
		mix-blend-mode: multiply;
	}

	:global(html.dark) .wait-stamp {
		mix-blend-mode: normal;
	}

	.wait-copy {
		position: relative;
		z-index: 1;
		margin: 0;
		color: var(--wait-muted);
		font-family: var(--font-mono, 'Azeret Mono', monospace);
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}

	@keyframes wait-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.wait-orbit {
			animation: none;
		}
	}
</style>
