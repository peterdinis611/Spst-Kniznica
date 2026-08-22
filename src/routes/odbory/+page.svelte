<script lang="ts">
	import CategoryTile from '$lib/components/CategoryTile.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo
	title="Odbory"
	description="Police školskej knižnice SPŠT podľa odborov. Nájdite učebnice a príručky pre svoj smer."
/>

<p class="text-muted-foreground max-w-lg font-serif text-lg">
	Každý odbor má vlastnú policu. Ťukni na obálku a uvidíš, čo z nej môžeš brať.
</p>

<div class="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
	{#each data.categories as cat (cat.id)}
		<CategoryTile category={cat} book={cat.cover} />
	{/each}
</div>
