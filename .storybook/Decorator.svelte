<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import type { Snippet } from 'svelte';

	let { children }: { children?: Snippet } = $props();
</script>

<ModeWatcher defaultMode="light" themeColors={{ light: '#f6f0e6', dark: '#16120e' }} />
<div class="sb-folio bg-background text-foreground min-h-dvh font-sans antialiased">
	{@render children?.()}
</div>
