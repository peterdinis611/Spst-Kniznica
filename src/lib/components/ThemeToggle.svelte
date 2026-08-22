<script lang="ts">
	import { toggleMode, mode } from 'mode-watcher';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';

	let { variant = 'desk' }: { variant?: 'desk' | 'hall' } = $props();

	const isDark = $derived(mode.current === 'dark');
	const label = $derived(isDark ? 'Zapnúť svetlé zobrazenie' : 'Zapnúť tmavé zobrazenie');
</script>

<button
	type="button"
	class={variant === 'hall'
		? 'hall-theme-btn'
		: 'grid size-10 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring'}
	onclick={toggleMode}
	aria-label={label}
	title={label}
>
	{#if isDark}
		<SunIcon class="size-4" />
	{:else}
		<MoonIcon class="size-4" />
	{/if}
</button>

<style>
	.hall-theme-btn {
		display: grid;
		place-items: center;
		width: 2.35rem;
		height: 2.35rem;
		border: 0;
		border-radius: 999px;
		background: var(--ink);
		color: var(--page);
		cursor: pointer;
	}

	.hall-theme-btn:hover {
		opacity: 0.82;
	}

	.hall-theme-btn:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 3px;
	}
</style>
