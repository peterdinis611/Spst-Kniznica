<script lang="ts">
	let { label, sub }: { label: string; sub?: string } = $props();
</script>

<div class="burst" aria-live="polite">
	<div class="lock-seal">
		{label}
		{#if sub}
			<span class="mt-1 block font-mono text-[0.7rem] font-semibold">{sub}</span>
		{/if}
	</div>
</div>
