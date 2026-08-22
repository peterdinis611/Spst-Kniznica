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
	class={variant === 'hall' ? 'hall-theme-btn' : 'desk-theme-btn'}
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
	.desk-theme-btn {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--card);
		color: var(--foreground);
		cursor: pointer;
	}

	.desk-theme-btn:hover {
		background: var(--muted);
	}

	.desk-theme-btn:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 3px;
	}
</style>
