<script lang="ts">
	import { onMount } from 'svelte';
	import { scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';

	let visible = $state(false);

	onMount(() => {
		function onScroll() {
			visible = window.scrollY > 420;
		}

		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});

	function toTop() {
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
	}
</script>

{#if visible}
	<button
		type="button"
		class="to-top"
		aria-label="Späť hore"
		onclick={toTop}
		transition:scale={{ duration: 280, start: 0.72, easing: cubicOut }}
	>
		<ArrowUpIcon class="size-4" />
	</button>
{/if}

<style>
	.to-top {
		position: fixed;
		right: 1.1rem;
		bottom: 1.1rem;
		z-index: 60;
		display: grid;
		place-items: center;
		width: 2.85rem;
		height: 2.85rem;
		border: 0;
		border-radius: 999px;
		background: var(--copper, #d46a1e);
		color: #fff;
		box-shadow: 0 12px 28px rgb(212 106 30 / 0.32);
		cursor: pointer;
	}

	.to-top:hover {
		background: var(--copper-deep, #b35512);
		transform: translateY(-2px);
	}

	.to-top:focus-visible {
		outline: 2px solid var(--copper, #d46a1e);
		outline-offset: 3px;
	}

	:global(.desk) .to-top {
		background: var(--primary);
		color: var(--primary-foreground);
		box-shadow: 0 12px 28px rgb(0 0 0 / 0.22);
	}

	:global(.desk) .to-top:hover {
		background: var(--accent);
		color: var(--accent-foreground);
	}

	@media (min-width: 720px) {
		.to-top {
			right: 1.5rem;
			bottom: 1.5rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.to-top {
			transition: none;
		}
	}
</style>
