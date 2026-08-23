<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PrintJacket from './PrintJacket.svelte';
	import { catalogBooks, sampleBook } from '$lib/stories/fixtures';

	const { Story } = defineMeta({
		title: 'Fond/PrintJacket',
		component: PrintJacket,
		tags: ['autodocs'],
		args: {
			book: sampleBook,
			linked: false
		}
	});
</script>

<Story name="Shelf" args={{ size: 'shelf' }} />

<Story name="Feature" args={{ size: 'feature' }} />

<Story name="Vypredaná" args={{ book: catalogBooks[1], size: 'shelf', linked: false }} />

<Story name="Police" asChild>
	<div class="flex flex-wrap items-end gap-5 p-4">
		{#each catalogBooks as item (item.id)}
			<PrintJacket book={item} linked={false} />
		{/each}
	</div>
</Story>
