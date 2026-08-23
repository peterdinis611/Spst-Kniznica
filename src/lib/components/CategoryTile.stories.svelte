<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CategoryTile from './CategoryTile.svelte';
	import { catalogBooks, categories } from '$lib/stories/fixtures';

	const { Story } = defineMeta({
		title: 'Fond/CategoryTile',
		component: CategoryTile,
		tags: ['autodocs']
	});
</script>

<Story name="S knihou" args={{ category: categories[0], book: catalogBooks[0] }} />

<Story name="Prázdna" args={{ category: categories[2] }} />

<Story name="Odbory" asChild>
	<div class="grid w-[32rem] grid-cols-2 gap-6 p-4">
		{#each categories as category, i (category.id)}
			<CategoryTile {category} book={catalogBooks[i]} />
		{/each}
	</div>
</Story>
