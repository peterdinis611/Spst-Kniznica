<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CatalogSlip from './CatalogSlip.svelte';
	import { catalogBooks } from '$lib/stories/fixtures';

	const { Story } = defineMeta({
		title: 'Fond/CatalogSlip',
		component: CatalogSlip,
		tags: ['autodocs']
	});
</script>

<Story name="Voľný" args={{ book: catalogBooks[0] }} />

<Story name="Vonku" args={{ book: catalogBooks[1] }} />

<Story name="Register" asChild>
	<div class="flex w-[36rem] flex-col gap-2 p-4">
		{#each catalogBooks as book (book.id)}
			<div class="h-16">
				<CatalogSlip {book} />
			</div>
		{/each}
	</div>
</Story>
