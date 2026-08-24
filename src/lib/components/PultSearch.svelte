<script lang="ts">
	let { query, placeholder = 'hľadať v zásuvke' }: { query: string; placeholder?: string } = $props();
</script>

<form class="pult-search" method="GET">
	<label class="sr-only" for="pult-q">Hľadať</label>
	<input id="pult-q" type="search" name="q" value={query} {placeholder} />
	<button class="bg-primary text-primary-foreground h-8 shrink-0 rounded-full px-3.5 text-[0.78rem] font-semibold" type="submit">
		Hľadať
	</button>
</form>
